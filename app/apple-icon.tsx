import { ImageResponse } from "next/og"

export const size = {
  width: 180,
  height: 180,
}

export const contentType = "image/png"

export default function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 160,
          background: "linear-gradient(to bottom right, #000000, #1a1a1a)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "40px",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="140"
          height="140"
          style={{ color: "#fbbf24" }}
        >
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
