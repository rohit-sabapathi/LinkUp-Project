from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserPreferenceViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'update'
    })),
]
