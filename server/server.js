const express = require("express");
const path = require("path");
const { execFile } = require("child_process");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Servidor funcionando correctamente"
    });
});

app.post("/api/video-info", (req, res) => {

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            success: false,
            message: "No se ha proporcionado ninguna URL"
        });
    }

    console.log("URL recibida:", url);

    execFile(
        "py",
        [
            "-m",
            "yt_dlp",

            "--js-runtimes",
            "node",

            "--dump-single-json",
            "--no-download",

            url
        ],
        (error, stdout, stderr) => {

            if (error) {

                console.error("Error yt-dlp:");
                console.error(stderr);

                return res.status(500).json({
                    success: false,
                    message: "No se ha podido obtener la información del vídeo"
                });
            }

            try {

                const video = JSON.parse(stdout);

                res.json({
                    success: true,
                    video: {
                        title: video.title,
                        duration: video.duration,
                        thumbnail: video.thumbnail,
                        uploader: video.uploader
                    }
                });

            } catch (parseError) {

                console.error("Error procesando JSON:");
                console.error(parseError);

                res.status(500).json({
                    success: false,
                    message: "Error procesando la información del vídeo"
                });
            }
        }
    );
});

app.post("/api/convert", (req, res) => {

   const { url, quality } = req.body;

    if (!url) {
        return res.status(400).json({
            success: false,
            message: "No se ha proporcionado ninguna URL"
        });
    }
    const allowedQualities = ["128K", "192K", "256K", "320K"];
    const selectedQuality = allowedQualities.includes(quality) ? quality : "192K";
    const downloadsPath = path.join(__dirname, "downloads");

    if (!fs.existsSync(downloadsPath)) {
        fs.mkdirSync(downloadsPath, {
            recursive: true
        });
    }

    console.log("Iniciando conversión:", url);

    execFile(
        "py",
        [
            "-m",
            "yt_dlp",

            "--js-runtimes",
            "node",

            "-x",

            "--audio-format",
            "mp3",

            "--audio-quality",
            selectedQuality,

            "--ffmpeg-location",
            "C:\\ffmpeg\\ffmpeg-9.0.1-essentials_build\\bin",

            "--restrict-filenames",

            "--print",
            "after_move:filepath",

            "-o",
            path.join(downloadsPath, "%(title)s.%(ext)s"),

            url
        ],
        (error, stdout, stderr) => {

            if (error) {

                console.error("Error durante la conversión:");
                console.error(stderr);

                return res.status(500).json({
                    success: false,
                    message: "No se ha podido convertir el vídeo"
                });
            }

            console.log("Salida de yt-dlp:");
            console.log(stdout);

            const lines = stdout
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(Boolean);

            const mp3Path = lines.find(line =>
                line.toLowerCase().endsWith(".mp3")
            );

            if (!mp3Path) {

                console.error(
                    "No se ha podido localizar el MP3 generado"
                );

                return res.status(500).json({
                    success: false,
                    message: "No se ha encontrado el MP3 generado"
                });
            }

            const mp3File = path.basename(mp3Path);

            console.log("MP3 generado:", mp3File);

            res.json({
                success: true,
                file: mp3File
            });
        }
    );
});

app.get("/api/download/:filename", (req, res) => {

    const filename = req.params.filename;
    const downloadsPath = path.join(__dirname, "downloads");
    const filePath = path.join(downloadsPath, filename);

    if (!fs.existsSync(filePath)) {

        return res.status(404).json({
            success: false,
            message: "Archivo no encontrado"
        });

    }

    console.log("Enviando archivo:", filename);

    res.download(filePath, filename, (error) => {

        if (error) {

            console.error(
                "Error durante la descarga:",
                error
            );

            return;
        }

        fs.unlink(filePath, (deleteError) => {

            if (deleteError) {

                console.error(
                    "No se pudo eliminar el archivo:",
                    deleteError
                );

                return;
            }

            console.log(
                "Archivo eliminado:",
                filename
            );

        });

    });

});

app.listen(PORT, () => {

    console.log(
        `Servidor iniciado en http://localhost:${PORT}`
    );

});