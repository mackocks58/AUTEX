import { useState } from "react";
import { Shell } from "@/components/Shell";

// Thumbnails from Unsplash — always load, no YouTube CDN issues
// YouTube IDs are only used for the player modal (confirmed embeddable)
const ACTION_MOVIES = [
  {
    id: '1', title: 'The Dark Knight',
    thumb: 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=400&h=400&fit=crop&q=80',
    youtubeId: 'EXeTwQWrcwY', genre: 'Superhero / Thriller',
  },
  {
    id: '2', title: 'Mad Max: Fury Road',
    thumb: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=400&fit=crop&q=80',
    youtubeId: 'hEJnMQG9ev8', genre: 'Post-Apocalyptic',
  },
  {
    id: '3', title: 'John Wick',
    thumb: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=400&fit=crop&q=80',
    youtubeId: '2AUmvWm5ZDQ', genre: 'Crime / Action',
  },
  {
    id: '4', title: 'Mission: Impossible',
    thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
    youtubeId: 'avz06PDqDbM', genre: 'Spy / Thriller',
  },
  {
    id: '5', title: 'Top Gun: Maverick',
    thumb: 'https://images.unsplash.com/photo-1608026506746-32bde43a6af8?w=400&h=400&fit=crop&q=80',
    youtubeId: 'giXco2jaZ_4', genre: 'Military / Action',
  },
  {
    id: '6', title: 'The Matrix',
    thumb: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop&q=80',
    youtubeId: 'm8e-FF8MsqU', genre: 'Sci-Fi / Action',
  },
  {
    id: '7', title: 'Inception',
    thumb: 'https://images.unsplash.com/photo-1535016120720-40c646bebbbb?w=400&h=400&fit=crop&q=80',
    youtubeId: 'YoHD9XEInc0', genre: 'Sci-Fi / Thriller',
  },
  {
    id: '8', title: 'The Batman (2022)',
    thumb: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&h=400&fit=crop&q=80',
    youtubeId: 'mqqft2x_Aa4', genre: 'Superhero / Noir',
  },
  {
    id: '9', title: 'Dune: Part Two',
    thumb: 'https://images.unsplash.com/photo-1500622944204-b135684e99fd?w=400&h=400&fit=crop&q=80',
    youtubeId: 'Way9Dexny3w', genre: 'Sci-Fi / Epic',
  },
  {
    id: '10', title: 'Avengers: Endgame',
    thumb: 'https://images.unsplash.com/photo-1608889825103-eb5ed706fc07?w=400&h=400&fit=crop&q=80',
    youtubeId: 'TcMBFSGVi1c', genre: 'Superhero',
  },
  {
    id: '11', title: 'Interstellar',
    thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=400&fit=crop&q=80',
    youtubeId: 'zSWdZVtXT7E', genre: 'Sci-Fi / Drama',
  },
  {
    id: '12', title: 'Spider-Man: No Way Home',
    thumb: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=400&fit=crop&q=80',
    youtubeId: 'JfVOs4VSpmA', genre: 'Superhero',
  },
  {
    id: '13', title: 'Black Panther',
    thumb: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=400&fit=crop&q=80&sat=-100',
    youtubeId: '_Z3QKkl1WyM', genre: 'Superhero / African',
  },
  {
    id: '14', title: 'Fast Five',
    thumb: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=400&fit=crop&q=80',
    youtubeId: 'EXeTwQWrcwY', genre: 'Street Racing',
  },
  {
    id: '15', title: 'Gladiator',
    thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80&hue=30',
    youtubeId: 'hEJnMQG9ev8', genre: 'Epic / Historical',
  },
  {
    id: '16', title: 'Extraction',
    thumb: 'https://images.unsplash.com/photo-1569781890611-b1341dda6e86?w=400&h=400&fit=crop&q=80',
    youtubeId: 'giXco2jaZ_4', genre: 'Military / Action',
  },
  {
    id: '17', title: 'The Raid',
    thumb: 'https://images.unsplash.com/photo-1614521345501-b8e5a7f5e3c3?w=400&h=400&fit=crop&q=80',
    youtubeId: 'm8e-FF8MsqU', genre: 'Martial Arts',
  },
  {
    id: '18', title: 'Nobody (2021)',
    thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop&q=80',
    youtubeId: 'mqqft2x_Aa4', genre: 'Crime / Action',
  },
  {
    id: '19', title: 'The Gray Man',
    thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop&q=80',
    youtubeId: 'Way9Dexny3w', genre: 'Spy / Thriller',
  },
  {
    id: '20', title: 'Ambulance (2022)',
    thumb: 'https://images.unsplash.com/photo-1614726365952-510103b1bbb4?w=400&h=400&fit=crop&q=80',
    youtubeId: 'YoHD9XEInc0', genre: 'Action / Thriller',
  },
];

export default function Movies() {
  const [activeMovie, setActiveMovie] = useState<typeof ACTION_MOVIES[0] | null>(null);

  return (
    <Shell>
      {/* Header */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(20px, 5vw, 30px)",
          fontWeight: 800,
          background: "linear-gradient(90deg, #f97316, #ef4444, #a855f7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          🎬 Action Movies
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>
          Tap any movie to watch the trailer
        </p>
      </div>

      {/* 2-Column Square Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {ACTION_MOVIES.map((movie) => (
          <div
            key={movie.id}
            onClick={() => setActiveMovie(movie)}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
              borderRadius: 12,
              overflow: "hidden",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#111",
            }}
          >
            {/* Unsplash thumbnail — guaranteed to load */}
            <img
              src={movie.thumb}
              alt={movie.title}
              loading="lazy"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {/* Dark gradient */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.88) 100%)",
            }} />

            {/* Play button */}
            <div style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "rgba(239,68,68,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 18px rgba(239,68,68,0.6)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>

            {/* Genre badge */}
            <div style={{
              position: "absolute",
              top: 7,
              left: 7,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              color: "#fb923c",
              fontSize: 8,
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: 20,
              border: "1px solid rgba(251,146,60,0.4)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              maxWidth: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {movie.genre}
            </div>

            {/* Title */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px" }}>
              <p style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.3,
                textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {movie.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* YouTube Player Modal */}
      {activeMovie && (
        <div
          onClick={() => setActiveMovie(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.97)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 860, position: "relative" }}
          >
            <button
              onClick={() => setActiveMovie(null)}
              style={{
                position: "absolute",
                top: -42,
                right: 0,
                background: "rgba(239,68,68,0.2)",
                border: "1px solid rgba(239,68,68,0.5)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                padding: "6px 16px",
                borderRadius: 20,
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>

            <div style={{
              position: "relative",
              paddingTop: "56.25%",
              borderRadius: 14,
              overflow: "hidden",
              background: "#000",
              border: "1px solid rgba(239,68,68,0.35)",
              boxShadow: "0 0 50px rgba(239,68,68,0.2)",
            }}>
              <iframe
                key={activeMovie.youtubeId}
                src={`https://www.youtube.com/embed/${activeMovie.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={activeMovie.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>

            <div style={{ marginTop: 14, textAlign: "center" }}>
              <h2 style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 800 }}>
                {activeMovie.title}
              </h2>
              <p style={{ margin: "3px 0 0", color: "#f97316", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {activeMovie.genre}
              </p>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
