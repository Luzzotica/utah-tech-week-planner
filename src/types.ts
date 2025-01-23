export interface EventData {
  id: number;
  title: string;
  host: string;
  address: string;
  registration_url: string;
  description: string;
  start: string;
  end: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}