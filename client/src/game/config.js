import Phaser from "phaser";
import MainScene from "./scenes/MainScene";


const config = {

    type: Phaser.AUTO,

    width: 800,

    height: 600,

    backgroundColor: "#111827",

    parent: "game-container",

    scene: [
        MainScene
    ],


    physics: {

        default: "arcade",

        arcade: {

            debug: false

        }

    }

};


export default config;