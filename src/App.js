import { useEffect, useRef, useState } from "react";

import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import classnames from "classnames";

const a = (2 * Math.PI) / 6;
const r = 50;

function getHexagonPoints(x, y) {
  const points = [];
  for (var i = 0; i < 6; i++) {
    points.push([x + r * Math.cos(a * i), y + r * Math.sin(a * i)]);
  }
  return points;
}

let startX = r;
let startY = r * Math.sin(a);

function shuffleArray(array) {
  const copy = JSON.parse(JSON.stringify(array));
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}
const levels = {
  Newbie: 0,
  Novice: 0.02,
  Fine: 0.05,
  Skilled: 0.08,
  Excellent: 0.15,
  Superb: 0.25,
  Marvellous: 0.4,
  Outstanding: 0.5,
  "Queen Bee 🐝": 0.7,
};

const getWordScore = (word, gameLetters) => {
  if (word.length === 4) return 1;
  if (gameLetters.split("").every((letter) => word.includes(letter)))
    return word.length + 7;
  return word.length;
};

function App() {
  const [game, setGame] = useState();
  useEffect(() => {
    fetch("https://freebee.fun/cgi-bin/today")
      .then((res) => res.json())
      .then(setGame);
  }, []);

  const [positions, setPositions] = useState([
    [-2, -3],
    [-2, 3],
    [2, -3],
    [2, 3],
    [-4, 0],
    [4, 0],
  ]);

  const reshuffle = () => setPositions((prev) => shuffleArray(prev));

  const [guess, setGuess] = useState("");

  const [guessed, setGuessed] = useState([]);
  const localRef = useRef();
  useEffect(() => {
    if (!game) return;
    localRef.current = "guessed_" + game.letters;
    setGuessed(
      JSON.parse(window.localStorage.getItem(localRef.current) ?? "[]")
    );
  }, [game]);
  useEffect(() => {
    if (!localRef.current) return;
    window.localStorage.setItem(localRef.current, JSON.stringify(guessed));
  }, [guessed]);

  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), 2000);
    return () => clearTimeout(timeout);
  }, [message]);

  const [showingPoints, setShowingPoints] = useState(0);
  const [showPointsState, setShowPointsState] = useState("idle");
  const showPointNotification = (points) => {
    setShowingPoints(points);
    setShowPointsState("in");
    setTimeout(() => setShowPointsState("out"), 200);
    setTimeout(() => setShowPointsState("idle"), 400);
    setTimeout(() => setShowingPoints(0), 400);
  };

  const handleEnter = () => {
    setMessage("");
    setGuess("");
    if (guessed.includes(guess)) return setMessage("Already guessed!");
    if (guess.length < 4) return setMessage("At least 4 letters!");
    if (!guess.includes(game.center)) {
      return setMessage("You didn't use center letter!");
    }

    if (!game.wordlist.includes(guess)) {
      return setMessage("Not in word list");
    }

    showPointNotification(getWordScore(guess, game.letters));
    setGuessed((prev) => [...prev, guess]);
  };

  useEffect(() => {
    const listener = (e) => {
      if (e.key === "Backspace") return setGuess((prev) => prev.slice(0, -1));
      if (e.key === "Enter") return handleEnter();
      if (e.keyCode >= 65 && e.keyCode <= 90) {
        setGuess((prev) => prev + e.key);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const [showGuessed, setShowGuessed] = useState(false);

  if (!game) return;

  const score = guessed.reduce((total, curGuess) => {
    return getWordScore(curGuess, game.letters) + total;
  }, 0);

  const level = Object.entries(levels).reduce((prev, [name, cur]) => {
    if (score >= parseInt(game.total * cur)) return { name, level: cur };
    return prev;
  }, {});

  if (showGuessed)
    return (
      <div className="h-screen flex flex-col justify-center items-center overflow-y-auto">
        {guessed.map((g) => (
          <div key={g}>{g}</div>
        ))}
        <div className="absolute top-0 right-0 p-8 text-slate-400">
          <ParentButton onClick={() => setShowGuessed(false)}>
            <XMarkIcon className="w-10" />
          </ParentButton>
        </div>
      </div>
    );
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center">
      <Toast message={message} />
      <div className="absolute top-0 left-0 w-full p-4 space-y-8">
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1 flex-grow overflow-x-auto">
            {[...guessed].reverse().map((g) => (
              <div
                key={g}
                className="text-xs uppercase text-gray-400 font-light"
              >
                {g}
              </div>
            ))}
          </div>
          <ParentButton
            onClick={() => setShowGuessed(true)}
            className="text-xs text-gray-400 font-light"
          >
            Show all ({guessed.length})
          </ParentButton>
        </div>
        <div className="flex items-center space-x-8">
          <div className="font-semibold whitespace-nowrap">{level.name}</div>
          <Example currentLevel={level.level} score={score} />
        </div>
      </div>

      <div className="relative text-4xl font-light text-center h-24 flex items-center focus:outline-none space-x-0.5 select-none">
        <div
          className={classnames(
            " rounded absolute top-1/2 left-1/2 -translate-x-1/2 p-2 transition-all duration-200",
            showPointsState === "out" && "-translate-y-32 opacity-0",
            showPointsState === "in" && "-translate-y-24 opacity-100",
            showPointsState === "idle" && "-translate-y-1/2 opacity-0"
          )}
        >
          +{showingPoints}
        </div>
        <span>{guess}</span>
        <Caret />
      </div>
      <div
        style={{
          height: 5 * r,
          position: "relative",
          width: 3 * r * Math.sin(a) * 2,
          padding: "20px 0px",
        }}
      >
        <Polygon
          offsetX={0}
          offsetY={0}
          center
          letter={game.center}
          onClick={() => setGuess((prev) => prev + game.center)}
        />
        {game.letters.split("").map((letter, i) => (
          <Polygon
            key={letter}
            letter={letter}
            offsetX={positions[i][0]}
            offsetY={positions[i][1]}
            onClick={() => setGuess((prev) => prev + letter)}
          />
        ))}
      </div>
      <div
        className="flex items-center space-x-4 pt-8 fixed bottom-0 w-full justify-center p-8
      "
      >
        <Button onClick={() => setGuess((prev) => prev.slice(0, -1))}>
          Delete
        </Button>
        <Button onClick={reshuffle}>
          <ArrowPathIcon className="w-6 text-slate-400" />
        </Button>
        <Button onClick={handleEnter}>Enter</Button>
      </div>
    </div>
  );
}

const Toast = (props) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(!!props.message);

    return () => {
      setShow(false);
    };
  }, [props.message]);
  return (
    <div
      className={classnames(
        "absolute top-0 pt-8 z-50 transform transition-all",
        !show ? "-translate-y-full opacity-0" : "opacity-100"
      )}
    >
      <div className="bg-gray-800 text-white p-2 rounded-lg">
        {props.message}
      </div>
    </div>
  );
};

const Caret = () => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setShow((prev) => !prev), 700);
    return () => clearInterval(interval);
  });
  return (
    <div
      className={classnames(
        show ? "visible" : "invisible",
        "h-8 w-0.5 bg-stone-600"
      )}
    />
  );
};

const ParentButton = (props) => {
  const [mouseDown, setMouseDown] = useState(false);

  return (
    <button
      onMouseDown={() => setMouseDown(true)}
      onMouseUp={() => setMouseDown(false)}
      onTouchStart={() => setMouseDown(true)}
      onTouchEnd={() => setMouseDown(false)}
      onMouseLeave={() => setMouseDown(false)}
      style={{ WebkitTapHighlightColor: "transparent" }}
      {...props}
      className={classnames(
        mouseDown && "scale-75 opacity-80",
        "select-none whitespace-nowrap",
        props.className
      )}
    />
  );
};

const Button = (props) => {
  return (
    <ParentButton
      className={classnames(
        "rounded-2xl border-slate-300 border px-6 py-4 text-slate-700 font-extralight transition-all transform"
      )}
      {...props}
    />
  );
};

const Polygon = (props) => {
  const [mouseDown, setMouseDown] = useState(false);

  useEffect(() => {
    const listener = (e) => {
      if (e.key === props.letter) setMouseDown(true);
    };
    const upListener = () => setMouseDown(false);
    window.addEventListener("keydown", listener);
    window.addEventListener("keyup", upListener);
    return () => {
      window.removeEventListener("keydown", listener);
      window.removeEventListener("keyup", upListener);
    };
  }, [props.letter]);
  return (
    <svg
      width={r * 2}
      height={r * Math.sin(a) * 2}
      className={classnames(
        "top-1/2 left-1/2 absolute transition-all duration-150",
        mouseDown && "opacity-60"
      )}
      style={{
        transform: `translate(${(-50 + props.offsetY * 25).toString()}%, ${(
          -50 +
          props.offsetX * 25
        ).toString()}%) ${!mouseDown ? "scale(0.95)" : "scale(0.8)"}`,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseDown={() => setMouseDown(true)}
      onTouchStart={() => setMouseDown(true)}
      onTouchEnd={() => setMouseDown(false)}
      onMouseUp={() => setMouseDown(false)}
      onMouseLeave={() => setMouseDown(false)}
      onClick={props.onClick}
    >
      <polygon
        className={props.center ? "fill-pink-400" : "fill-stone-300"}
        points={getHexagonPoints(startX, startY)
          .map((p) => p.join(","))
          .join(" ")}
      />
      <text
        x="50%"
        y="50%"
        dy="0.35em"
        className={classnames(
          "text-2xl align-middle font-black fill-stone-700 select-none pointer-events-none",
          props.center && "fill-pink-900"
        )}
        style={{
          textAnchor: "middle",
        }}
      >
        {props.letter.toUpperCase()}
      </text>
    </svg>
  );
};

export default App;

function Example(props) {
  const isLast = (stepIdx) =>
    stepIdx === Object.entries(levels).length - 1 ? "flex-1" : "";
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between w-full">
        {Object.entries(levels).map(([name, level], stepIdx) => (
          <li
            key={name}
            className={classnames(!isLast(stepIdx) ? "flex-1" : "", "relative")}
          >
            {level < props.currentLevel ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-pink-400" />
                </div>
                <div
                  href="#"
                  className="relative flex h-2 w-2 items-center justify-center rounded-full bg-pink-400"
                ></div>
              </>
            ) : level === props.currentLevel ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  href="#"
                  className={classnames(
                    isLast(stepIdx) ? "" : "-translate-x-1/3",
                    "relative flex transform h-6 w-6 items-center justify-center rounded-full bg-pink-400 text-white text-xs font-semibold"
                  )}
                  aria-current="step"
                >
                  {props.score}
                </div>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  href="#"
                  className="group relative flex h-2 w-2 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300"
                    aria-hidden="true"
                  />
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
