import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type MessageRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: MessageRole
  text: string
}

const GOOGLE_AI_STUDIO_API_KEY = 'REPLACE_WITH_YOUR_GOOGLE_AI_STUDIO_API_KEY'
const MODEL_NAME = 'gemini-2.0-flash'

const STARTER_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hello! I am your Gemini-powered assistant. Ask me anything to begin.',
}

const buildPayload = (messages: ChatMessage[]) => ({
  contents: messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.text }],
  })),
})

const readModelText = (data: unknown): string | null => {
  if (!data || typeof data !== 'object') {
    return null
  }

  const responseData = data as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>
      }
    }>
  }

  const parts = responseData.candidates?.[0]?.content?.parts ?? []
  const combinedText = parts
    .map((part) => part.text?.trim() ?? '')
    .filter(Boolean)
    .join('\n')

  return combinedText || null
}

const askGemini = async (messages: ChatMessage[]) => {
  if (GOOGLE_AI_STUDIO_API_KEY.startsWith('REPLACE_WITH_')) {
    throw new Error('Add your real Google AI Studio API key in src/App.tsx.')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GOOGLE_AI_STUDIO_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(messages)),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Google API error (${response.status}): ${details}`)
  }

  const data = await response.json()
  const text = readModelText(data)

  if (!text) {
    throw new Error('The model returned an empty response.')
  }

  return text
}

const makeMessage = (role: MessageRole, text: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  text,
})

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const prompt = input.trim()

    if (!prompt || isLoading) {
      return
    }

    const userMessage = makeMessage('user', prompt)
    const historyForRequest = [...messages, userMessage]

    setMessages((previous) => [...previous, userMessage])
    setInput('')
    setError('')
    setIsLoading(true)

    try {
      const answer = await askGemini(historyForRequest)
      setMessages((previous) => [...previous, makeMessage('assistant', answer)])
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while contacting Gemini.'

      setError(errorMessage)
      setMessages((previous) => [
        ...previous,
        makeMessage(
          'assistant',
          'I could not complete that request. Check your API key and try again.',
        ),
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    if (isLoading) {
      return
    }

    setMessages([STARTER_MESSAGE])
    setInput('')
    setError('')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">React + Google AI Studio</p>
          <h1>Orbit Chat</h1>
        </div>
        <button type="button" className="ghost-button" onClick={clearChat}>
          New chat
        </button>
      </header>

      <section className="chat-window" aria-live="polite">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`message message-${message.role}`}
            aria-label={`${message.role} message`}
          >
            <p>{message.text}</p>
          </article>
        ))}

        {isLoading && (
          <article className="message message-assistant message-loading">
            <p>Thinking...</p>
          </article>
        )}

        <div ref={bottomRef} />
      </section>

      <form className="composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="prompt">
          Ask anything
        </label>

        <textarea
          id="prompt"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask Gemini something useful..."
          rows={3}
          disabled={isLoading}
          required
        />

        <div className="composer-footer">
          <p className="helper-text">
            API key is intentionally stored in frontend code as requested.
          </p>
          <button type="submit" className="send-button" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="error-banner">
          {error}
        </p>
      )}

      <footer className="footer-note">
        Model: {MODEL_NAME} via Google AI Studio Generate Content API.
      </footer>
    </div>
  )
}

export default App
