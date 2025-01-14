from django.urls import path, include
from rest_framework_nested import routers
from . import views

router = routers.DefaultRouter()
router.register('', views.PostViewSet, basename='post')

posts_router = routers.NestedDefaultRouter(router, '', lookup='post')
posts_router.register('comments', views.CommentViewSet, basename='post-comments')

urlpatterns = [
    path('user/<int:user_id>/', views.UserPostsView.as_view(), name='user-posts'),
    path('', include(router.urls)),
    path('', include(posts_router.urls)),
]
