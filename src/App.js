import kodi from "kodi-websocket";
import { useCallback, useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faStop } from "@fortawesome/free-solid-svg-icons";

import "./App.scss";
import LogoCDINPY from "./assets/logo-cdinpy.png";
import LogoJica from "./assets/logo-jica.png";
import LogoAsociacion from "./assets/logo-asociacion.png";

function sleep(ms) {
  return new Promise((res) => {
    setTimeout(function () {
      res();
    }, ms);
  });
}

/* Utility function to stop all active players of a kodi instance */
const PlayerControls = ({
  onClose,
  playerStatus,
  playPausePlayer,
  stopPlayer,
}) => {
  return (
    <div className="playerControls">
      <div className="controls">
        {playerStatus === "paused" && (
          <FontAwesomeIcon
            icon={faPlay}
            color="whlte"
            className="mr-4"
            onClick={playPausePlayer}
          />
        )}
        {playerStatus === "playing" && (
          <FontAwesomeIcon
            icon={faPause}
            color="white"
            className="mr-4"
            onClick={playPausePlayer}
          />
        )}
        {playerStatus === "playing" && (
          <FontAwesomeIcon
            icon={faStop}
            color="white"
            className="mr-4"
            onClick={stopPlayer}
          />
        )}
      </div>
    </div>
  );
};

function App() {
  const [currentMenu, setCurrentMenu] = useState(null);
  const [connection, setConnection] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [playerStatus, setPlayerStatus] = useState(null);

  const initializeConnection = useCallback(async () => {
    const con = await kodi("192.168.1.109", 9090);

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
    });

    setConnection(con);
  }, []);

  const stopAllActivePlayers = async (con) => {
    const players = await con.Player.GetActivePlayers();

    await Promise.all(
      players.map((player) => con.Player.Stop(player.playerid))
    );
  };

  const playSlideshow = async (folderName) => {
    await stopAllActivePlayers(connection);

    await connection.Player.Open({
      item: { directory: folderName },
    });
  };

  const playPausePlayer = async () => {
    const players = await connection.Player.GetActivePlayers();

    await Promise.all(
      players.map((player) => connection.Player.PlayPause(player.playerid))
    );
  };

  const stopPlayer = async () => {
    const players = await connection.Player.GetActivePlayers();

    await Promise.all(
      players.map((player) => connection.Player.Stop(player.playerid))
    );
  };

  const playDemo = useCallback(async () => {
    /* Stop all players, then start the video */
    await stopAllActivePlayers(connection);

    const movies = await connection.Files.GetDirectory({
      directory: "/storage/videos/",
      media: "video",
    });

    // console.log("movies", movies);
    // console.log("file", movies?.files?.[0]?.file);

    await connection.Player.Open({
      item: { file: movies?.files?.[0]?.file },
    });

    /* Stop the video after 20 seconds */
    // await sleep(20000);
    // await stopAllActivePlayers(connection);
  }, []);

  const MENU_INMIGRACION = [
    {
      name: "📹 Documental",
      action: () => playDemo(),
    },
    {
      name: "🖼 Galería de Fotos",
      action: () => playSlideshow("/storage/pictures/01-inmigracion/"),
    },
    {
      name: "⬅️ Volver a menú principal",
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
      action: () => playDemo(),
    },
    {
      name: "Lenguaje Nikkei",
      action: () => playDemo(),
    },
    {
      name: "Nihongogakko",
      action: () => playDemo(),
    },
    {
      name: "Música Nikkei",
      action: () => playDemo(),
    },
    {
      name: "Taiko - Yosakoi",
      action: () => playDemo(),
    },
  ];

  useEffect(() => {
    console.log("connection changed", connection);
  }, [connection]);

  useEffect(() => {
    setCurrentMenu(MAIN_MENU);
    initializeConnection();
  }, []);

  if (!connection || connection?.closed) return null;

  return (
    <>
      <div id="backgroundArt" />

      <img
        src={LogoCDINPY}
        style={{ width: 600, marginBottom: 40 }}
        alt="logo"
      />

      <Container fluid>
        <Row>
          <Col>
            <p>
              Elegir idoma: <a href="#">Español</a> / <a href="#">日本語</a>
            </p>
          </Col>
        </Row>

        {currentMenu?.map?.((item) => {
          return (
            <Row key={item.name} className="menuOption">
              <Col>
                <Button size="lg" onClick={item.action}>
                  {item.name}
                </Button>
              </Col>
            </Row>
          );
        })}
      </Container>

      {controlsVisible && (
        <PlayerControls
          onClose={() => setControlsVisible(false)}
          playerStatus={playerStatus}
          playPausePlayer={playPausePlayer}
          stopPlayer={stopPlayer}
        />
      )}

      <div style={{ position: "absolute", bottom: 20, right: 20 }}>
        <img src={LogoAsociacion} style={{ height: 100 }} alt="logo" />
        <img src={LogoJica} style={{ height: 100 }} alt="logo" />
      </div>
    </>
  );
}

export default App;
