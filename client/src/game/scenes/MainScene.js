import Phaser from "phaser";


class MainScene extends Phaser.Scene {

    constructor() {
        super("MainScene");
    }


    create() {

        this.add.text(
            250,
            250,
            "🎮 Pixel Kingdom",
            {
                fontSize: "48px",
                fill: "#ffffff"
            }
        );

    }

}


export default MainScene;