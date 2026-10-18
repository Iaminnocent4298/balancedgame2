import { lazy, Suspense, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { watchAuth } from "./auth";
import { VERSION } from "./version";

const AuthForm = lazy(() => import("./AuthForm"));
const SignedInApp = lazy(() => import("./SignedInApp"));

const BANNER = `${import.meta.env.BASE_URL}banner.png`;
const LOGO = `${import.meta.env.BASE_URL}logo.png`;
const SPLASH_TEXTS = [
  "(BG1) 99% of gamblers quit before they win big!",
  "(BG1) Rolling a mythic is only 1 roll away! (or 99)",
  "(BG1) Setting a player ablaze does not deal damage",
  "(BG1) Neutral damage? Where's positive and negative damage?",
  "(BG1) Rerolling a weapon does NOT cost 0 AP",
  "(BG1) “WOOF???????” - Brian",
  "(BG1) I am Brian's dog - *lava bucket*",
  "(BG1) Wolf tried to swim in lava",
  "(BG1) Misinput misinput IT WAS A MISINPUT CALM DOWN",
  "(BG1) “To defeat your enemy, you must first create the universe”",
  "(BG1) “NO I DIDN'T WANT TO DONATE ALL MY AP TO BRIAN”",
  "(BG1) Nginx is actually pronounced en-ginks",
  "(BG1) “Processing is Javascript” - Ms. Krasteva 2024",
  "(BG1) Made with Ready to Program!",
  "(BG1) How many updates can i release in 24 hours challenge",
  `(BG1) v${VERSION} - Removed Justin`,
  "(BG1) How are there more mythic rolls than legendaries",
  "(BG1) “Reset my luck” “Common Common Common Common Common”",
  "(BG1) “New Event! -100% ALL DAMAGE” L bozo",
  "(BG1) “WHY IS IT THROWING AN ERROR- oh.”",
  "(BG1) No, the logo is not the spikes from Boxel Rebound",
  "(BG1) When you reroll a common and it was worse than the previous common",
  '(BG1) "Lemme poke Brian" -> java.lang.NullPointerException',
  '(BG1) "It\'s winter!" "Great what\'s the temperature" "20 degrees-"',
  '(BG1) "Why do i keep rolling commons" Also has a Fabled',
  "(BG1) Game balancing? What's that?",
  "(BG1) The goal of the game is to make your opponent's health 0 while keeping your own health above 0",
  "(BG1) Bing Bong noises",
  "(BG1) Unga Bunga",
  '(BG1) "object Object"',
  '(BG1) "No o no No No"',
  "(BG1) ap bankN!KNKNK!NK!N",
  "(BG1) Beta server shenanigans",
  '(BG1) "This is fine actually" meanwhile Eric dealing 3000 damage with only spell 1 spam',
  "(BG1) When the disaster stops you from completing a lockout challenge",
  '(BG1) "You should be able to complete the exam in 30-45 mins" - Ms. Krasteva',
  "(BG1) Blåhaj",
  "(BG1) *Matches 0 numbers* YOU HAVE WON THE JACKPOT!",
  "(BG1) RTP CUP!",
  "(BG1) Colin really has the worst luck in the world...",
  '(BG1) "I have a genius strat" *Does 0 damage*',
  "(BG1) How has a single group roll 2 MYTHICS AND 1 FABLED IN THE SAME GAME",
  "(BG1) Ruh Ruh Raggy - unknown",
  "(BG1) 😰 - Fei",
  "(BG1) 🤩 - April",
  "(BG1) bonk bonk banana sun",
  "(BG1) VEHICULAR MANSLAUGHTER!!",
  "(BG1) bob the builder",
  "(BG1) all hail google rng",
  '(BG1) "I\'M GETTING STUN-LOCKED" - Brian',
  "(BG1) Kenneth after dying twice in the first 6 turns of the game",
  '(BG1) "Nuh uh" - Kenneth',
  "(BG1) Petition to ban April from rolling anything other than a common",
  "(BG1) Imagine being the 13th player",
  "(BG1) The damage calculation is ALWAYS incorrect!",
  "(BG1) With great features come great bugs",
  "(BG1) You think your strats will go undetected without being nerfed? Then you're WRONG",
  "(BG1) I am..... inevitable",
];
const SPLASH_TEXT = SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)];

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => watchAuth(setUser), []);

  if (user === undefined) return <p>Loading...</p>;

  // Logged out: banner and login form, no welcome bar
  if (user === null) {
    return (
      <div className="app">
        <img className="banner" src={BANNER} alt="Balanced Game" />
        <div className="splash-text">{SPLASH_TEXT}</div>
        <Suspense fallback={<p>Loading...</p>}>
          <AuthForm />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="app">
      <Suspense fallback={<p>Loading...</p>}>
        <SignedInApp
          key={user.uid}
          user={user}
          banner={BANNER}
          logo={LOGO}
          splashText={SPLASH_TEXT}
        />
      </Suspense>
    </div>
  );
}