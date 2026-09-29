const urlInput = document.getElementById("youtube-url");
const convertButton = document.getElementById("convert-button");
const status = document.getElementById("status");
const videoInfo = document.getElementById("video-info");
const videoThumbnail = document.getElementById("video-thumbnail");
const videoTitle = document.getElementById("video-title");
const videoUploader = document.getElementById("video-uploader");
const videoDuration = document.getElementById("video-duration");
const downloadButton = document.getElementById("download-button");
const qualitySelect = document.getElementById("quality");

convertButton.addEventListener("click", async () => {

    const url = urlInput.value.trim();

    if (!url) {
        status.textContent = "Introduce una URL de YouTube.";
        return;
    }
    convertButton.disabled = true;
    status.textContent = "Obteniendo información del vídeo...";

    try {

        const response = await fetch("/api/video-info", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                url: url
            })
        });

        const data = await response.json();

        if (!data.success) {
            status.textContent = data.message;
            return;
        }

        const video = data.video;

        videoTitle.textContent = video.title;
        videoUploader.textContent = video.uploader;
        videoThumbnail.src = video.thumbnail;

        const minutes = Math.floor(video.duration / 60);
        const seconds = video.duration % 60;

        videoDuration.textContent =
            `${minutes}:${seconds.toString().padStart(2, "0")}`;

        videoInfo.classList.remove("hidden");

        status.textContent = "Vídeo encontrado";

    } catch (error) {

        console.error(error);

        status.textContent = "Error conectando con el servidor";
    }
    finally {
    convertButton.disabled = false;
}
});
downloadButton.addEventListener("click", async () => {

    const url = urlInput.value.trim();

    if (!url) {
        status.textContent = "Introduce una URL de YouTube.";
        return;
    }

    downloadButton.disabled = true;
    downloadButton.textContent = "Convirtiendo...";

    status.textContent =
        "Descargando audio y convirtiendo a MP3...";

    try {

        const response = await fetch("/api/convert", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                url: url,
                quality: qualitySelect.value
            })

        });

        const data = await response.json();

        if (!data.success) {

            status.textContent = data.message;

            return;
        }

        status.textContent = "MP3 preparado. Descargando...";

        const downloadUrl =
            `/api/download/${encodeURIComponent(data.file)}`;

        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = data.file;

        document.body.appendChild(link);

        link.click();

        link.remove();

        status.textContent = "Descarga completada";

    } catch (error) {

        console.error(error);

        status.textContent =
            "Ha ocurrido un error durante la conversión";

    } finally {

        downloadButton.disabled = false;
        downloadButton.textContent = "Descargar MP3";

    }

});