from django.urls import path

from users.views import CurrentUserView, LoginView, RefreshTokenView, RegisterView


urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="auth-me"),
]
