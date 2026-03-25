from pydantic import BaseModel, root_validator
from typing import List, Union
import json

from schemas.debug import DebugRequest
from schemas.execute import RunRequest


class Requests(BaseModel):
    id: str
    handle: str
    body: Union[RunRequest, DebugRequest]

    @root_validator(pre=True)
    def parse_body_string(data):
        if isinstance(data, str):
            return json.loads(data)
        return data


class Message(BaseModel):
    message_id: str
    md5_of_body: str
    body: Requests
    attributes: dict
    message_attributes: dict
    md5_of_message_attributes: str


class Details(BaseModel):
    queue_id: str
    message: Message


class MessageItem(BaseModel):
    event_metadata: dict
    details: Details


class CloudTriggerRequest(BaseModel):
    messages: List[MessageItem]