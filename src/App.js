import kodi from "kodi-websocket";
import { useCallback, useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay, faPause, faStop } from "@fortawesome/free-solid-svg-icons";

import "./App.scss";
import LogoCDINPY from "./assets/logo-cdinpy.png";
import LogoJica from "./assets/logo-jica.png";
import LogoAsociacion from "./assets/logo-asociacion.png";

const HOST = "192.168.0.2";

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
            color="white"
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
  const [language, setLanguage] = useState("es");

  const activateScreensaver = async () => {
    await playSlideshow("/storage/pictures/screensaver/");
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
      options: {
        shuffled: true,
        repeat: "all",
      },
    });
    await con.Player.Open({
      item: { directory: "/storage/music/screensaver" },
      options: {
        shuffled: true,
        repeat: "all",
      },
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

  // const MENU_INMIGRACION = [
  //   {
  //     name_es: "Documental",
  //     name_jp: "ドキュメンタリー",
  //     action: () => playChapter("01"),
  //   },
  //   // {
  //   //   name_es: "Galería de Fotos",
  //   //   name_jp: "写真館",
  //   //   action: () => playSlideshow("/storage/pictures/01-inmigracion/"),
  //   // },
  //   {
  //     name_es: "⬅️ Volver",
  //     name_jp: "⬅️ 戻る",
  //     color: "#e21e12",
  //     action: () => setCurrentMenu(MAIN_MENU),
  //   },
  // ];

  const MENU_4 = [
    {
      name_es: "Sketch 1",
      name_jp: "動画 1",
    },
    {
      name_es: "Sketch 2",
      name_jp: "動画 2",
      action: () => playChapter("03/02"),
    },
    {
      name_es: "Sketch 3",
      name_jp: "動画 3",
      action: () => playChapter("03/03"),
    },
    {
      name_es: "⬅️ Volver",
      name_jp: "⬅️ 戻る",
      color: "#e21e12",
      action: () => setCurrentMenu(MAIN_MENU),
    },
  ];

  const MAIN_MENU = [
    {
      name_es: "La migración japonesa",
      name_jp: "移住の歴史",
      // action: () => setCurrentMenu(MENU_INMIGRACION),
      action: () => playChapter("01"),
    },
    {
      name_es: "KOUREISHA SHAKAI",
      name_jp: "高齢者社会",
      // action: () => setCurrentMenu(MENU_2),
      action: () => playChapter("02"),
    },
    {
      name_es: "Nihongo gakko",
      name_jp: "日本語学校",
      action: () => playChapter("03"),
    },
    {
      name_es: "Lenguaje nikkei paraguayo",
      name_jp: "パ•日系 言語",
      action: () => setCurrentMenu(MENU_4),
    },
    {
      name_es: "Taiko - Yosakoi",
      name_jp: "太鼓 • よさこい",
      // action: () => setCurrentMenu(MENU_5),
      action: () => playChapter("05"),
    },
    {
      name_es: "Música Nikkei",
      name_jp: "日系 音楽",
      action: () => playChapter("06"),
    },
  ];

  useEffect(() => {
    setCurrentMenu(MAIN_MENU);
    initializeConnection();
  }, []);

  return (
    <div>
      <div id="backgroundArt" />

      <div style={{ zIndex: 999, position: "relative" }}>
        <div>
          <img src={LogoCDINPY} className="logo" alt="logo" />
        </div>

        <div style={{ position: "fixed", top: 150, right: 20, zIndex: 9999 }}>
          <h4 style={{ margin: 20 }}>
            {language === "jp" ? "言語設定" : "Elegir idioma:"} <br />
            <a
              href="#"
              onClick={() => setLanguage("es")}
              style={{ color: "#120B79" }}
            >
              Español
            </a>{" "}
            /{" "}
            <a
              href="#"
              onClick={() => setLanguage("jp")}
              style={{ color: "red" }}
            >
              日本語
            </a>
          </h4>
        </div>

        <Container fluid>
          {currentMenu?.map?.((item, idx) => {
            return (
              <Row
                key={idx}
                className="menuOption"
                style={{ marginBottom: 15 }}
              >
                <Col>
                  <Button
                    size="sm"
                    onClick={item.action}
                    style={{
                      backgroundColor: item.color || "#945324",
                      opacity: 0.8,
                      border: 0,
                    }}
                  >
                    <span style={{ fontSize: language === "es" ? 22 : 35 }}>
                      {language === "jp"
                        ? item.name_jp?.toUpperCase?.()
                        : item.name_es?.toUpperCase?.()}
                    </span>
                  </Button>
                </Col>
              </Row>
            );
          })}
        </Container>
        <div className="credits">
          <img
            src={LogoAsociacion}
            style={{ height: 80, marginRight: 20 }}
            alt="logo"
          />
          <img src={LogoJica} style={{ height: 80 }} alt="logo" />
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
      </div>
    </div>
  );
}

export default App;
