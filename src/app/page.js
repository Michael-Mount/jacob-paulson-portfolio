import PlaylistPlayer from "./components/PlaylistPlayer";
import About from "./components/About";
import Contact from "./components/Contact";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div id="player">
        <PlaylistPlayer />
      </div>
      <div id="about">
        <About />
      </div>
      <div id="contact">
        <Contact />
      </div>
    </main>
  );
}
