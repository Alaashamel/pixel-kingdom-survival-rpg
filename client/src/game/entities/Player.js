import Phaser from "phaser";


class Player extends Phaser.GameObjects.Rectangle {


    constructor(scene, x, y) {


        super(
            scene,
            x,
            y,
            40,
            40,
            0x00ff00
        );


        scene.add.existing(this);


        this.speed = 250;


        this.health = 100;


        scene.physics.add.existing(this);


        this.body.setCollideWorldBounds(true);

    }



    move(cursors) {


        this.body.setVelocity(0);



        if (cursors.left.isDown) {

            this.body.setVelocityX(-this.speed);

        }


        else if (cursors.right.isDown) {

            this.body.setVelocityX(this.speed);

        }



        if (cursors.up.isDown) {

            this.body.setVelocityY(-this.speed);

        }


        else if (cursors.down.isDown) {

            this.body.setVelocityY(this.speed);

        }


    }



}


export default Player;