from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    UserProfileView,
    CurrentUserView,
    GoogleLoginAPIView,
    follow_user,
    unfollow_user,
    get_followers,
    get_following,
    SearchUsersView,
    handle_follow_request,
    get_notifications,
    mark_notification_read,
    get_follow_request_status,
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('profile/<int:pk>/', UserProfileView.as_view(), name='user-profile'),
    path('follow/', follow_user, name='follow-user'),
    path('unfollow/', unfollow_user, name='unfollow-user'),
    path('followers/<int:user_id>/', get_followers, name='user-followers'),
    path('following/<int:user_id>/', get_following, name='user-following'),
    path('search/', SearchUsersView.as_view(), name='search-users'),
    path('follow-request/handle/', handle_follow_request, name='handle-follow-request'),
    path('follow-request/status/<int:user_id>/', get_follow_request_status, name='follow-request-status'),
    path('notifications/', get_notifications, name='get-notifications'),
    path('notifications/<int:notification_id>/read/', mark_notification_read, name='mark-notification-read'),
    path('google/', GoogleLoginAPIView.as_view(), name='google'),
]
