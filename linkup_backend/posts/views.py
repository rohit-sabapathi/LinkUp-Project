from rest_framework import viewsets, status, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer

User = get_user_model()

class UserPostsView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Post.objects.filter(author_id=user_id).prefetch_related(
            'author', 'likes', 'saved_by', 'comments', 'comments__author', 'comments__likes'
        ).order_by('-created_at')

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Post.objects.prefetch_related(
            'author', 'likes', 'saved_by', 'comments', 'comments__author', 'comments__likes'
        ).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        if post.likes.filter(id=request.user.id).exists():
            post.likes.remove(request.user)
            return Response({'status': 'unliked'})
        else:
            post.likes.add(request.user)
            return Response({'status': 'liked'})

    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        post = self.get_object()
        if post.saved_by.filter(id=request.user.id).exists():
            post.saved_by.remove(request.user)
            return Response({'status': 'unsaved'})
        else:
            post.saved_by.add(request.user)
            return Response({'status': 'saved'})

    @action(detail=False, methods=['get'])
    def saved(self, request):
        saved_posts = Post.objects.filter(saved_by=request.user)
        page = self.paginate_queryset(saved_posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(saved_posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def user(self, request, user_pk=None):
        user_posts = self.get_queryset().filter(author_id=user_pk)
        page = self.paginate_queryset(user_posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(user_posts, many=True)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(post_id=self.kwargs.get('post_pk')).select_related('author')

    def perform_create(self, serializer):
        post = get_object_or_404(Post, pk=self.kwargs.get('post_pk'))
        serializer.save(author=self.request.user, post=post)

    @action(detail=True, methods=['post'])
    def like(self, request, post_pk=None, pk=None):
        comment = self.get_object()
        if comment.likes.filter(id=request.user.id).exists():
            comment.likes.remove(request.user)
            return Response({'status': 'unliked'})
        else:
            comment.likes.add(request.user)
            return Response({'status': 'liked'})
