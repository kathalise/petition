console.log($, "sanity check");
(function () {
    let isSigning = false;
    let x = 0;
    let y = 0;
    const $canvas = $("#canvas");
    const canvas = $canvas[0]; // getting actual html element
    const context = canvas.getContext("2d");
    // const dataURL = canvas.toDataURL();
    // console.log("dataURL", dataURL);

    $("#canvas").on("mousedown", (event) => {
        x = event.offsetX;
        y = event.offsetY;
        isSigning = true;
    });

    $("#canvas").on("mousemove", (event) => {
        if (isSigning == true) {
            createSignature(context, x, y, event.offsetX, event.offsetY);
            x = event.offsetX;
            y = event.offsetY;
        }
    });

    $(window).on("mouseup", (event) => {
        if (isSigning == true) {
            createSignature(context, x, y, event.offsetX, event.offsetY);
            x = 0;
            y = 0;
            isSigning = false;
        }
    });

    function createSignature(contect, x1, y1, x2, y2) {
        context.beginPath();
        context.strokeStyle = "blue";
        context.lineWidth = 1.5;
        context.moveTo(x1, y1);
        context.lineTo(x2, y2);
        context.stroke();
        context.closePath();
    }
})();
