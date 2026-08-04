import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import aiosmtplib
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def _send_via_resend(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """Send via Resend HTTP API. Returns True on success."""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={
                "from": f"cforj <{settings.smtp_from}>",
                "to": [to_email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            },
        )
    if resp.status_code in (200, 201):
        return True
    logger.error("Resend failed to %s: %s %s", to_email, resp.status_code, resp.text)
    return False


async def _send_via_smtp(message: MIMEMultipart, to_email: str) -> None:
    """Send via SMTP — SSL (465) or STARTTLS (587)."""
    if not settings.smtp_host:
        return

    use_tls = settings.smtp_port == 465
    start_tls = settings.smtp_port == 587

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            use_tls=use_tls,
            start_tls=start_tls,
            timeout=10,
        )
    except Exception as exc:
        logger.error("SMTP send failed to %s: %s", to_email, exc)


async def _send(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
    mime_message: MIMEMultipart,
) -> None:
    """Send email — Resend takes priority, SMTP as fallback."""
    if settings.resend_api_key:
        await _send_via_resend(to_email, subject, html_body, text_body)
    elif settings.smtp_host:
        await _send_via_smtp(mime_message, to_email)
    else:
        logger.info("No email provider configured — skipping email to %s", to_email)


def _base_html(content: str) -> str:
    """Shared branded wrapper for all emails."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px">
          <svg width="120" height="38" viewBox="0 0 220 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#34d399"/>
                <stop offset="100%" stop-color="#818cf8"/>
              </linearGradient>
            </defs>
            <path d="M32 36 Q32 10 8 10 Q-16 10 -16 36 Q-16 62 32 62 Q80 62 80 36 Q80 10 32 10"
                  fill="none" stroke="url(#g1)" stroke-width="3" stroke-linecap="round"/>
            <circle cx="32" cy="36" r="4" fill="url(#g1)"/>
            <text x="68" y="40" font-family="'SF Pro Display',-apple-system,sans-serif"
                  font-weight="700" font-size="30" fill="#0f0f13" letter-spacing="-0.5">cforj</text>
          </svg>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">

          <!-- Gradient bar -->
          <tr><td style="background:linear-gradient(135deg,#34d399,#818cf8);height:4px;line-height:4px;font-size:0">&nbsp;</td></tr>

          <!-- Content -->
          <tr><td style="padding:36px 40px">
            {content}
          </td></tr>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center">
          <p style="margin:0;font-size:12px;color:#9ca3af">
            © 2025 cforj · Course Forge Studio<br/>
            <a href="mailto:privacy@cforj.studio" style="color:#9ca3af;text-decoration:none">privacy@cforj.studio</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


async def send_verification_code_email(to_email: str, code: str, name: str = "") -> None:
    """Send 6-digit email verification code."""
    greeting = f"Hi {name}," if name else "Hello,"

    content = f"""
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f0f13">Verify your email</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6">
        {greeting} use the code below to complete your sign-in to cforj.
        The code is valid for <strong style="color:#374151">10 minutes</strong>.
      </p>

      <!-- Code block -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;
                  padding:24px;text-align:center;margin-bottom:28px">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#9ca3af;
                  letter-spacing:2px;text-transform:uppercase">Verification code</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:12px;
                    color:#0f0f13;font-family:'SF Mono','Fira Code',monospace;
                    background:linear-gradient(135deg,#34d399,#818cf8);
                    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                    background-clip:text">{code}</div>
      </div>

      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6">
        If you didn't request this code, you can safely ignore this email.
        Your account remains secure.
      </p>
    """

    subject = f"{code} is your cforj verification code"
    html_body = _base_html(content)
    text_body = f"Your cforj verification code: {code}\n\nValid for 10 minutes.\n\nIf you didn't request this, ignore this email."

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"cforj <{settings.smtp_from}>"
    message["To"] = to_email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    await _send(to_email, subject, html_body, text_body, message)


async def send_invite_email(to_email: str, invite_url: str, course_title: str) -> None:
    """Send collaboration invite email."""
    content = f"""
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f0f13">You're invited to collaborate</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6">
        You've been invited to co-edit
        <strong style="color:#374151">{course_title}</strong> on cforj.
        Click the button below to accept your invitation.
      </p>

      <div style="text-align:center;margin-bottom:28px">
        <a href="{invite_url}"
           style="display:inline-block;background:linear-gradient(135deg,#34d399,#059669);
                  color:#ffffff;text-decoration:none;padding:14px 32px;
                  border-radius:10px;font-size:15px;font-weight:600">
          Accept invitation →
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6">
        If you don't have a cforj account yet, you'll be prompted to create one after clicking the link.
        If you received this by mistake, you can safely ignore this email.
      </p>
    """

    subject = f"You've been invited to collaborate on \"{course_title}\" — cforj"
    html_body = _base_html(content)
    text_body = f"You've been invited to collaborate on \"{course_title}\" on cforj.\n\nAccept here: {invite_url}\n\nIf you received this by mistake, ignore it."

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"cforj <{settings.smtp_from}>"
    message["To"] = to_email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    await _send(to_email, subject, html_body, text_body, message)


async def send_password_reset_email(to_email: str, reset_url: str) -> None:
    """Send password reset email."""
    content = f"""
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#0f0f13">Reset your password</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6">
        We received a request to reset your cforj password.
        Click the button below to set a new password.
        This link is valid for <strong style="color:#374151">1 hour</strong>.
      </p>

      <div style="text-align:center;margin-bottom:28px">
        <a href="{reset_url}"
           style="display:inline-block;background:linear-gradient(135deg,#34d399,#059669);
                  color:#ffffff;text-decoration:none;padding:14px 32px;
                  border-radius:10px;font-size:15px;font-weight:600">
          Reset password →
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </p>
    """

    subject = "Reset your password — cforj"
    html_body = _base_html(content)
    text_body = f"Reset your cforj password:\n\n{reset_url}\n\nValid for 1 hour. If you didn't request this, ignore this email."

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"cforj <{settings.smtp_from}>"
    message["To"] = to_email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))

    await _send(to_email, subject, html_body, text_body, message)
