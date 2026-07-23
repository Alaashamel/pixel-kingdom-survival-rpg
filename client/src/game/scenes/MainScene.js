import Phaser from "phaser";
import Player from "../entities/Player";


class MainScene extends Phaser.Scene {


    constructor() {

        super("MainScene");

    }



    create() {


        this.player = new Player(
            this,
            400,
            300
        );


        this.cursors =
            this.input.keyboard.createCursorKeys();



        this.cameras.main.startFollow(
            this.player
        );



        this.add.text(
            20,
            20,
            "Player System Loaded",
            {
                fontSize:"24px",
                fill:"#ffffff"
            }
        );


    }



    update() {


        this.player.move(
            this.cursors
        );


    }


}



export default MainScene;