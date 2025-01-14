from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from django.conf import settings
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import razorpay
import hmac
import hashlib
import logging

logger = logging.getLogger(__name__)

from .models import Event, EventRegistration, DonationCampaign, Donation
from .serializers import EventSerializer, EventRegistrationSerializer, DonationCampaignSerializer, DonationSerializer
from .permissions import IsOrganizerOrReadOnly

# Initialize Razorpay client
razorpay_client = razorpay.Client(
    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
)

# Create your views here.

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.user_type == 'admin'

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.filter(is_active=True)
    serializer_class = EventSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    http_method_names = ['get', 'post', 'patch', 'delete']
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires.
        """
        if self.action == 'list' or self.action == 'retrieve':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def initial(self, request, *args, **kwargs):
        """Add debugging information before processing the request"""
        logger.info(f"Method: {request.method}")
        logger.info(f"Headers: {dict(request.headers)}")
        logger.info(f"Action: {self.action}")
        logger.info(f"Auth: {request.auth}")
        logger.info(f"User: {request.user}")
        logger.info(f"User Type: {request.user.user_type if request.user.is_authenticated else 'Anonymous'}")
        return super().initial(request, *args, **kwargs)

    def get_queryset(self):
        logger.info("\n=== Get Events Query ===")
        queryset = Event.objects.all().order_by('-created_at')
        logger.info(f"Initial queryset count: {queryset.count()}")
        logger.info(f"Query params: {self.request.query_params}")
        
        # Only filter by is_active if specifically requested
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
            logger.info(f"After is_active filter count: {queryset.count()}")
        
        # Search functionality
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
            logger.info(f"After search filter count: {queryset.count()}")

        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
            logger.info(f"After event type filter count: {queryset.count()}")

        # Filter by date range
        start_after = self.request.query_params.get('start_after')
        start_before = self.request.query_params.get('start_before')
        if start_after:
            queryset = queryset.filter(start_date__gte=start_after)
            logger.info(f"After start_after filter count: {queryset.count()}")
        if start_before:
            queryset = queryset.filter(start_date__lte=start_before)
            logger.info(f"After start_before filter count: {queryset.count()}")

        # Filter by virtual/physical
        is_virtual = self.request.query_params.get('is_virtual')
        if is_virtual is not None and is_virtual != '':
            is_virtual_bool = is_virtual.lower() == 'true'
            queryset = queryset.filter(is_virtual=is_virtual_bool)
            logger.info(f"After is_virtual filter count: {queryset.count()}")

        logger.info(f"Final queryset SQL: {queryset.query}")
        logger.info(f"Final queryset count: {queryset.count()}")
        return queryset.select_related('organizer')

    def perform_create(self, serializer):
        try:
            serializer.save(organizer=self.request.user)
        except Exception as e:
            logger.error(f"Error in perform_create: {str(e)}")
            raise

    def create(self, request, *args, **kwargs):
        try:
            logger.info("\n=== Debug Information ===")
            logger.info(f"Request Method: {request.method}")
            logger.info(f"Request Headers: {dict(request.headers)}")
            logger.info(f"Request Data: {request.data}")
            logger.info(f"Request User: {request.user}")
            logger.info(f"Request Auth: {request.auth}")
            logger.info(f"Action: {self.action}")
            logger.info("======================\n")
            
            if not request.user.is_authenticated:
                return Response(
                    {'detail': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Serializer Errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating event: {str(e)}")
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        event = self.get_object()
        
        # Check if registration deadline has passed
        if event.registration_deadline and event.registration_deadline < timezone.now():
            return Response(
                {'detail': 'Registration deadline has passed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user is already registered
        if EventRegistration.objects.filter(event=event, participant=request.user).exists():
            return Response(
                {'detail': 'You are already registered for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create registration
        registration = EventRegistration(
            event=event,
            participant=request.user,
            status='registered' if not event.is_full else 'waitlisted'
        )
        registration.save()

        return Response(
            EventRegistrationSerializer(registration).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def cancel_registration(self, request, pk=None):
        event = self.get_object()
        try:
            registration = EventRegistration.objects.get(
                event=event,
                participant=request.user
            )
            registration.status = 'cancelled'
            registration.save()

            # If there are waitlisted registrations and this was a confirmed registration,
            # move the first waitlisted registration to registered
            if registration.status == 'registered':
                waitlisted = EventRegistration.objects.filter(
                    event=event,
                    status='waitlisted'
                ).order_by('registration_date').first()
                
                if waitlisted:
                    waitlisted.status = 'registered'
                    waitlisted.save()

            return Response(
                EventRegistrationSerializer(registration).data,
                status=status.HTTP_200_OK
            )
        except EventRegistration.DoesNotExist:
            return Response(
                {'detail': 'You are not registered for this event'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True)
    def registrations(self, request, pk=None):
        event = self.get_object()
        if request.user != event.organizer:
            return Response(
                {'detail': 'You do not have permission to view registrations'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        registrations = event.registrations.all()
        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_events(self, request):
        events = self.get_queryset()
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    def list(self, request, *args, **kwargs):
        try:
            logger.info("\n=== Fetching events list ===")
            logger.info(f"Request User: {request.user}")
            logger.info(f"Request Query Params: {request.query_params}")
            
            # Get the base queryset
            queryset = self.get_queryset()
            logger.info(f"Base queryset count: {queryset.count()}")
            logger.info(f"Base queryset SQL: {queryset.query}")
            
            # Apply any additional filtering
            queryset = self.filter_queryset(queryset)
            logger.info(f"Filtered queryset count: {queryset.count()}")
            
            # Get paginated results if pagination is enabled
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                logger.info(f"Returning paginated response with {len(serializer.data)} items")
                return self.get_paginated_response(serializer.data)

            # If no pagination, serialize all results
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data
            logger.info(f"Returning full response with {len(data)} items")
            
            # Log the first few items for debugging
            if data:
                logger.info(f"First event in response: {data[0]}")
            else:
                logger.info("No events found in database")
            
            return Response(data)
        except Exception as e:
            logger.error(f"Error in list view: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to fetch events', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EventRegistrationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EventRegistration.objects.filter(participant=self.request.user)

class DonationCampaignViewSet(viewsets.ModelViewSet):
    queryset = DonationCampaign.objects.all()
    serializer_class = DonationCampaignSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrReadOnly]

    def get_queryset(self):
        queryset = DonationCampaign.objects.all()
        
        # Filter by status (active, ended)
        status = self.request.query_params.get('status')
        now = timezone.now()
        if status == 'active':
            queryset = queryset.filter(
                is_active=True,
                start_date__lte=now,
                end_date__gt=now
            )
        elif status == 'ended':
            queryset = queryset.filter(
                Q(end_date__lte=now) | Q(is_active=False)
            )

        # Filter by organizer
        organizer_id = self.request.query_params.get('organizer')
        if organizer_id:
            queryset = queryset.filter(organizer_id=organizer_id)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search)
            )

        return queryset.select_related('organizer')

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class DonationViewSet(viewsets.ModelViewSet):
    serializer_class = DonationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Donation.objects.all()
        return Donation.objects.filter(
            Q(donor=self.request.user) |
            Q(campaign__organizer=self.request.user)
        )

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        try:
            # Validate input
            campaign_id = request.data.get('campaign')
            amount = float(request.data.get('amount', 0))
            
            try:
                campaign = DonationCampaign.objects.get(id=campaign_id)
            except DonationCampaign.DoesNotExist:
                return Response(
                    {'error': 'Campaign not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Validate campaign status
            if not campaign.is_active or campaign.end_date < timezone.now():
                return Response(
                    {'error': 'Campaign has ended'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create Razorpay order
            order_amount = int(amount * 100)  # Convert to paise
            order_currency = 'INR'
            order_data = {
                'amount': order_amount,
                'currency': order_currency,
                'payment_capture': 1,  # Auto-capture
                'notes': {
                    'campaign_id': str(campaign.id),
                    'donor_id': str(request.user.id)
                }
            }
            
            razorpay_order = razorpay_client.order.create(order_data)
            logger.info(f"Created Razorpay order: {razorpay_order['id']}")

            # Create donation record
            donation = Donation.objects.create(
                campaign=campaign,
                donor=request.user,
                amount=amount,
                razorpay_order_id=razorpay_order['id'],
                is_anonymous=request.data.get('is_anonymous', False),
                message=request.data.get('message', '')
            )
            logger.info(f"Created donation record: {donation.id}")

            response_data = {
                'order_id': razorpay_order['id'],
                'amount': order_amount,
                'currency': order_currency,
                'key': settings.RAZORPAY_KEY_ID,
                'donation_id': donation.id,
                'prefill': {
                    'name': request.user.get_full_name(),
                    'email': request.user.email
                }
            }
            return Response(response_data)

        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        try:
            razorpay_payment_id = request.data.get('razorpay_payment_id')
            razorpay_order_id = request.data.get('razorpay_order_id')
            razorpay_signature = request.data.get('razorpay_signature')

            logger.info(f"Verifying payment: {razorpay_order_id}")

            # First, try to get the donation record
            try:
                donation = Donation.objects.get(razorpay_order_id=razorpay_order_id)
            except Donation.DoesNotExist:
                logger.error(f"Donation not found for order: {razorpay_order_id}")
                return Response(
                    {'error': 'Invalid order ID'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if payment is already processed
            if donation.payment_status == 'successful':
                return Response({'status': 'Payment already processed'})

            # Verify signature
            try:
                params_dict = {
                    'razorpay_payment_id': razorpay_payment_id,
                    'razorpay_order_id': razorpay_order_id,
                    'razorpay_signature': razorpay_signature
                }
                razorpay_client.utility.verify_payment_signature(params_dict)

                # Update donation record
                with transaction.atomic():
                    donation.payment_status = 'successful'
                    donation.razorpay_payment_id = razorpay_payment_id
                    donation.razorpay_signature = razorpay_signature
                    donation.save()

                    # Update campaign amount
                    campaign = donation.campaign
                    campaign.current_amount += donation.amount
                    campaign.save()

                logger.info(f"Payment successful for order: {razorpay_order_id}")
                return Response({
                    'status': 'Payment successful',
                    'donation_id': donation.id,
                    'amount': donation.amount
                })

            except razorpay.errors.SignatureVerificationError:
                logger.error(f"Signature verification failed for order: {razorpay_order_id}")
                donation.payment_status = 'failed'
                donation.save()
                return Response(
                    {'error': 'Payment verification failed'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            logger.error(f"Error verifying payment: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
