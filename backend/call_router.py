from fastapi import APIRouter, Request
from fastapi.responses import Response
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from pydantic import BaseModel
import os, json, base64
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID  = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN   = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")
BASE_URL            = os.environ.get("BASE_URL", "")

router = APIRouter(prefix="/api/call", tags=["calls"])
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def encode_lines(lines: list[str]) -> str:
    """Encode lines list into a URL-safe string."""
    return base64.urlsafe_b64encode(json.dumps(lines).encode()).decode()


def decode_lines(encoded: str) -> list[str]:
    """Decode lines from URL-safe string."""
    return json.loads(base64.urlsafe_b64decode(encoded.encode()).decode())


class CallRequest(BaseModel):
    phone_number: str
    lines: list[str]


@router.post("/initiate")
async def initiate_call(body: CallRequest):
    encoded = encode_lines(body.lines)
    call = client.calls.create(
        to=body.phone_number,
        from_=TWILIO_PHONE_NUMBER,
        url=f"{BASE_URL}/api/call/webhook/start?lines={encoded}&turn=0",
        method="POST",
    )
    return {"call_sid": call.sid}


@router.post("/webhook/start")
async def webhook_start(request: Request):
    encoded = request.query_params.get("lines", "")
    turn    = int(request.query_params.get("turn", 0))

    vr = VoiceResponse()

    if not encoded:
        vr.say("Goodbye.")
        vr.hangup()
        return Response(content=str(vr), media_type="application/xml")

    lines = decode_lines(encoded)

    if not lines:
        vr.say("Goodbye.")
        vr.hangup()
        return Response(content=str(vr), media_type="application/xml")

    vr.say(lines[turn])

    gather = Gather(
        input="speech",
        action=f"{BASE_URL}/api/call/webhook/gather?lines={encoded}&turn={turn}",
        method="POST",
        timeout=8,
        speech_timeout="auto",
    )
    vr.append(gather)
    vr.redirect(f"{BASE_URL}/api/call/webhook/gather?lines={encoded}&turn={turn}")

    return Response(content=str(vr), media_type="application/xml")


@router.post("/webhook/gather")
async def webhook_gather(request: Request):
    encoded = request.query_params.get("lines", "")
    turn    = int(request.query_params.get("turn", 0))

    vr = VoiceResponse()

    if not encoded:
        vr.say("Goodbye.")
        vr.hangup()
        return Response(content=str(vr), media_type="application/xml")

    lines     = decode_lines(encoded)
    next_turn = turn + 1

    if next_turn >= len(lines):
        vr.say("Goodbye.")
        vr.hangup()
        return Response(content=str(vr), media_type="application/xml")

    vr.say(lines[next_turn])

    if next_turn + 1 < len(lines):
        gather = Gather(
            input="speech",
            action=f"{BASE_URL}/api/call/webhook/gather?lines={encoded}&turn={next_turn}",
            method="POST",
            timeout=8,
            speech_timeout="auto",
        )
        vr.append(gather)
        vr.redirect(f"{BASE_URL}/api/call/webhook/gather?lines={encoded}&turn={next_turn}")
    else:
        vr.pause(length=1)
        vr.hangup()

    return Response(content=str(vr), media_type="application/xml")