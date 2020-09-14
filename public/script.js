console.log($, "sanity check");
(function () {
    const canvas = $("#canvas");
    // console.log("canvas: ", canvas);
    // console.log("canvas[0]: ", canvas[0]);
    //throws error 'cannot read property of undefined (canvas[0])
    const context = canvas[0].getContext("2d");

    let isSigning = false;
    let x = 0;
    let y = 0;
    context.placeholder = "sign here";

    canvas.on("mousedown", (event) => {
        x = event.offsetX;
        y = event.offsetY;
        isSigning = true;
    });

    canvas.on("mousemove", (event) => {
        if (isSigning == true) {
            createSignature(context, x, y, event.offsetX, event.offsetY);
            x = event.offsetX;
            y = event.offsetY;
        }
    });

    canvas.on("mouseup", (event) => {
        if (isSigning == true) {
            createSignature(context, x, y, event.offsetX, event.offsetY);
            x = 0;
            y = 0;
            isSigning = false;
            let actualSignature = $("#signature");
            let signatureImage = canvas[0].toDataURL();
            actualSignature.val(signatureImage);
        }
    });

    function createSignature(contect, x1, y1, x2, y2) {
        context.beginPath();
        context.strokeStyle = "blue";
        context.lineWidth = 2;
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.closePath();
    }
})();
