from rest_framework import serializers
from .models import Event, EventRegistration, DonationCampaign, Donation
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'profile_photo']

    def get_full_name(self, obj):
        return obj.get_full_name()

class EventRegistrationSerializer(serializers.ModelSerializer):
    participant_name = serializers.SerializerMethodField()
    participant_email = serializers.SerializerMethodField()

    class Meta:
        model = EventRegistration
        fields = ['id', 'event', 'participant', 'participant_name', 'participant_email', 
                 'status', 'registration_date', 'notes']
        read_only_fields = ['participant', 'status']

    def get_participant_name(self, obj):
        return obj.participant.get_full_name()

    def get_participant_email(self, obj):
        return obj.participant.email

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.SerializerMethodField()
    is_past = serializers.BooleanField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    registered_participants_count = serializers.SerializerMethodField()
    user_registration_status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'event_type', 'start_date', 'end_date',
                 'location', 'is_virtual', 'max_participants', 'registration_deadline',
                 'organizer', 'organizer_name', 'created_at', 'updated_at', 'is_active',
                 'image', 'meeting_link', 'meeting_id', 'meeting_password', 'is_past',
                 'is_full', 'registered_participants_count', 'user_registration_status']
        read_only_fields = ['organizer', 'created_at', 'updated_at']

    def get_organizer_name(self, obj):
        return obj.organizer.get_full_name()

    def get_registered_participants_count(self, obj):
        return obj.registrations.filter(status='registered').count()

    def get_user_registration_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        try:
            registration = obj.registrations.get(participant=request.user)
            return registration.status
        except EventRegistration.DoesNotExist:
            return None

    def validate(self, data):
        # Ensure end_date is after start_date
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError({
                    'end_date': 'End date must be after start date'
                })

        # Ensure registration_deadline is before start_date
        if data.get('registration_deadline') and data.get('start_date'):
            if data['registration_deadline'] >= data['start_date']:
                raise serializers.ValidationError({
                    'registration_deadline': 'Registration deadline must be before event start date'
                })

        # Ensure dates are in the future for new events
        if not self.instance:  # Only for new events
            now = timezone.now()
            if data.get('start_date') and data['start_date'] <= now:
                raise serializers.ValidationError({
                    'start_date': 'Start date must be in the future'
                })
            if data.get('registration_deadline') and data['registration_deadline'] <= now:
                raise serializers.ValidationError({
                    'registration_deadline': 'Registration deadline must be in the future'
                })

        # Virtual event validation
        if data.get('is_virtual'):
            if not data.get('meeting_link'):
                raise serializers.ValidationError({
                    'meeting_link': 'Meeting link is required for virtual events'
                })

        return data

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(str(e))

class DonationCampaignSerializer(serializers.ModelSerializer):
    organizer = UserMinimalSerializer(read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)
    total_donors = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()

    class Meta:
        model = DonationCampaign
        fields = ['id', 'title', 'description', 'goal_amount', 'current_amount',
                 'start_date', 'end_date', 'image', 'organizer', 'is_active',
                 'created_at', 'updated_at', 'progress_percentage',
                 'total_donors', 'time_remaining']
        read_only_fields = ['organizer', 'current_amount', 'created_at',
                           'updated_at']

    def validate(self, data):
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError(
                    "End date must be after start date"
                )
            if data['start_date'] < timezone.now():
                raise serializers.ValidationError(
                    "Start date cannot be in the past"
                )
        return data

    def get_total_donors(self, obj):
        return obj.donations.filter(
            payment_status='successful'
        ).values('donor').distinct().count()

    def get_time_remaining(self, obj):
        now = timezone.now()
        if obj.end_date > now:
            time_diff = obj.end_date - now
            days = time_diff.days
            hours = time_diff.seconds // 3600
            if days > 0:
                return f"{days} days"
            elif hours > 0:
                return f"{hours} hours"
            else:
                minutes = (time_diff.seconds % 3600) // 60
                return f"{minutes} minutes"
        return "Campaign ended"

class DonationSerializer(serializers.ModelSerializer):
    donor = UserMinimalSerializer(read_only=True)
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)

    class Meta:
        model = Donation
        fields = ['id', 'campaign', 'campaign_title', 'donor', 'amount',
                 'payment_status', 'razorpay_payment_id', 'razorpay_order_id',
                 'razorpay_signature', 'is_anonymous', 'message', 'created_at']
        read_only_fields = ['payment_status', 'razorpay_payment_id',
                           'razorpay_order_id', 'razorpay_signature']

    def validate_amount(self, value):
        min_amount = 1  # Minimum donation amount in INR
        if value < min_amount:
            raise serializers.ValidationError(
                f"Minimum donation amount is ₹{min_amount}"
            )
        return value
