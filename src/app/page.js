import PlaylistPlayer from "./components/PlaylistPlayer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div id="player">
        <PlaylistPlayer />
      </div>
    </main>
  );
}
