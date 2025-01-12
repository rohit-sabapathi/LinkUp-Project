from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventRegistrationViewSet, DonationCampaignViewSet, DonationViewSet

router = DefaultRouter()
router.register(r'', EventViewSet, basename='event')
router.register(r'registrations', EventRegistrationViewSet, basename='event-registration')
router.register(r'campaigns', DonationCampaignViewSet, basename='donation-campaign')
router.register(r'donations', DonationViewSet, basename='donation')

urlpatterns = [
    path('', include(router.urls)),
]
