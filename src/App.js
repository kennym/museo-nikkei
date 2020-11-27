import kodi from "kodi-websocket";
import { useCallback, useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faStop } from "@fortawesome/free-solid-svg-icons";

import "./App.scss";
import LogoCDINPY from "./assets/logo-cdinpy.png";
import LogoJica from "./assets/logo-jica.png";
import LogoAsociacion from "./assets/logo-asociacion.png";

const HOST = "192.168.1.109";

function sleep(ms) {
  return new Promise((res) => {
    setTimeout(function () {
      res();
    }, ms);
  });
}

/* Utility function to stop all active players of a kodi instance */
const PlayerControls = ({
  playerStatus,
  playPausePlayer,
  stopPlayer,
  activateScreensaver,
}) => {
  return (
    <div className="playerControls">
      <div className="controls">
        {playerStatus === "paused" && (
          <FontAwesomeIcon
            icon={faPlay}
            color="whlte"
            className="mr-5"
            onClick={playPausePlayer}
          />
        )}
        {playerStatus === "playing" && (
          <FontAwesomeIcon
            icon={faPause}
            color="white"
            className="mr-5"
            onClick={playPausePlayer}
          />
        )}
        {playerStatus === "playing" && (
          <FontAwesomeIcon
            icon={faStop}
            color="white"
            onClick={async () => {
              await stopPlayer();
              await activateScreensaver();
            }}
          />
        )}
      </div>
    </div>
  );
};

function App() {
  const [currentMenu, setCurrentMenu] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [playerStatus, setPlayerStatus] = useState(null);

  const activateScreensaver = async () => {
    await playSlideshow("/storage/pictures/screensaver/");

    // const con = await kodi(HOST, 9090);
    // const players = await con.Player.GetActivePlayers();
    // await Promise.all(
    //   players.map((player) => con.GUI.ActivateWindow({ window: "screensaver" }))
    // );
  };

  const initializeConnection = useCallback(async () => {
    const con = await kodi(HOST, 9090);

    con.notification("Player.OnPause", () => {
      setControlsVisible(true);
      setPlayerStatus("playing");
    });

    con.notification("Player.OnResume", () => {
      setControlsVisible(true);
      setPlayerStatus("playing");
      console.log("Resumed");
    });

    con.notification("Player.OnAVStart", () => {
      console.log("OnAVStart");
      setControlsVisible(true);
      setPlayerStatus("playing");
    });

    con.notification("Player.OnStop", () => {
      console.log("OnStop");
      setPlayerStatus("stopped");
      setControlsVisible(false);
      sleep(5000);
    });

    con.socket.addEventListener("error", () => {
      console.log("error");
    });

    con.socket.addEventListener("close", () => {
      console.log("close");
    });
  }, []);

  const stopAllActivePlayers = async () => {
    const con = await kodi(HOST, 9090);
    const players = await con.Player.GetActivePlayers();

    await Promise.all(
      players.map((player) => con.Player.Stop(player.playerid))
    );
  };

  const playSlideshow = async (folderName) => {
    await stopAllActivePlayers();
    const con = await kodi(HOST, 9090);

    await con.Player.Open({
      item: { directory: folderName },
    });
    await con.Player.Open({
      item: { directory: "/storage/music/screensaver" },
    });
  };

  const playPausePlayer = async () => {
    const con = await kodi(HOST, 9090);
    const players = await con.Player.GetActivePlayers();

    await Promise.all(
      players.map((player) => con.Player.PlayPause(player.playerid))
    );
  };

  const stopPlayer = async () => {
    const con = await kodi(HOST, 9090);
    const players = await con.Player.GetActivePlayers();

    await Promise.all(
      players.map((player) => con.Player.Stop(player.playerid))
    );
  };

  const playChapter = async (chapter) => {
    /* Stop all players, then start the video */
    await stopAllActivePlayers();

    const con = await kodi(HOST, 9090);
    const movies = await con.Files.GetDirectory({
      directory: `/storage/videos/${chapter}`,
      media: "video",
    });

    await con.Player.Open({
      item: { file: movies?.files?.[0]?.file },
    });
  };

  const MENU_INMIGRACION = [
    {
      name: "📹 Documental",
      action: () => playChapter("01"),
    },
    {
      name: "🖼 Galería de Fotos",
      action: () => playSlideshow("/storage/pictures/01-inmigracion/"),
    },
    {
      name: "⬅️ Volver a menú principal",
      color: "#e21e12",
      action: () => setCurrentMenu(MAIN_MENU),
    },
  ];

  const MAIN_MENU = [
    {
      name: "Inmigración a Paraguay",
      action: () => setCurrentMenu(MENU_INMIGRACION),
    },
    {
      name: "Kouresha Shakai",
      action: () => playChapter("02"),
    },
    {
      name: "Lenguaje Nikkei",
      action: () => playChapter("03"),
    },
    {
      name: "Nihongogakko",
      action: () => playChapter("04"),
    },
    {
      name: "Música Nikkei",
      action: () => playChapter("05"),
    },
    {
      name: "Taiko - Yosakoi",
      action: () => playChapter("06"),
    },
  ];

  useEffect(() => {
    setCurrentMenu(MAIN_MENU);
    initializeConnection();
  }, []);

  return (
    <>
      <div id="backgroundArt" />

      <img
        src={LogoCDINPY}
        style={{ width: 600, marginBottom: 40 }}
        alt="logo"
      />

      <Container fluid>
        {currentMenu?.map?.((item) => {
          return (
            <Row key={item.name} className="menuOption">
              <Col>
                <Button
                  size="lg"
                  onClick={item.action}
                  style={{ backgroundColor: item.color }}
                >
                  {item.name}
                </Button>
              </Col>
            </Row>
          );
        })}
      </Container>
      <div className="credits">
        <img src={LogoAsociacion} style={{ height: 100 }} alt="logo" />
        <img src={LogoJica} style={{ height: 100 }} alt="logo" />
      </div>

      {controlsVisible && (
        <PlayerControls
          onClose={() => setControlsVisible(false)}
          playerStatus={playerStatus}
          playPausePlayer={playPausePlayer}
          stopPlayer={stopPlayer}
          activateScreensaver={activateScreensaver}
        />
      )}
    </>
  );
}

export default App;
