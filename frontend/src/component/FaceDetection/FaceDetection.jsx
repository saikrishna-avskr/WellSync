import React, { useEffect, useRef } from "react";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import * as faceapi from "@vladmandic/face-api";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FaceDetection = ({ setSuggestions }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoStreamRef = useRef(null);
  const moodIntervalRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);
  const modelsLoadedRef = useRef(false);
  const requestCompletedRef = useRef(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const tf = faceapi.tf;
        await tf.ready();
        if (!tf.getBackend()) {
          try {
            await tf.setBackend("webgl");
          } catch {
            await tf.setBackend("cpu");
          }
        }
        await tf.ready();

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models"),
          faceapi.nets.ageGenderNet.loadFromUri("/models"),
        ]);
        modelsLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading face-api models:", error);
      }
    };

    const startVideo = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API is not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((error) => {
              console.error("Error starting video playback:", error);
            });
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startVideo();
    loadModels();

    return () => {
      stopVideoStream();
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoPlay = async () => {
      if (!modelsLoadedRef.current) {
        let retries = 0;
        while (!modelsLoadedRef.current && retries < 80) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries += 1;
        }
      }

      if (!modelsLoadedRef.current) {
        console.error("Face models are not loaded. Detection aborted.");
        return;
      }

      const canvas = faceapi.createCanvasFromMedia(video);
      document.body.append(canvas);
      canvasRef.current = canvas;
      const { left, top, width, height } = video.getBoundingClientRect();
      canvas.style.position = "absolute";
      canvas.style.left = `${left}px`;
      canvas.style.top = `${top}px`;
      canvas.width = width;
      canvas.height = height;
      canvas.style.zIndex = 9999;
      const displaySize = { width: width, height: height };
      faceapi.matchDimensions(canvas, displaySize);

      let moodData = [];
      let detectionCount = 0;

      fallbackTimeoutRef.current = setTimeout(() => {
        if (requestCompletedRef.current) {
          return;
        }
        clearInterval(moodIntervalRef.current);
        stopVideoStream();
        const averageMood = "happy";
        const age = 25;
        sendMoodToAPI(averageMood, age);
        if (canvasRef.current) canvasRef.current.remove();
      }, 10000);

      moodIntervalRef.current = setInterval(async () => {
        if (requestCompletedRef.current) {
          clearInterval(moodIntervalRef.current);
          return;
        }

        if (!video.paused && !video.ended) {
          let detections = [];
          try {
            detections = await faceapi
              .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceExpressions()
              .withAgeAndGender();
          } catch (error) {
            console.error("Face detection iteration failed:", error);
            clearInterval(moodIntervalRef.current);
            clearTimeout(fallbackTimeoutRef.current);
            stopVideoStream();
            if (!requestCompletedRef.current) {
              sendMoodToAPI("happy", 25);
            }
            return;
          }

          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize,
          );

          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

          if (detections.length > 0) {
            const moodScores = detections[0].expressions;
            moodData.push(moodScores);
            detectionCount++;
          }

          if (detectionCount >= 50) {
            clearTimeout(fallbackTimeoutRef.current);
            clearInterval(moodIntervalRef.current);
            stopVideoStream();
            const averageMood = calculateAverageMood(moodData);
            const age = detections[0]?.age || 25;
            sendMoodToAPI(averageMood, age);
            if (canvasRef.current) canvasRef.current.remove();
          }
        }
      }, 100);
    };

    video.addEventListener("play", handleVideoPlay);

    return () => {
      if (video) {
        video.removeEventListener("play", handleVideoPlay);
      }
      if (moodIntervalRef.current) {
        clearInterval(moodIntervalRef.current);
      }
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
      if (canvasRef.current) {
        canvasRef.current.remove();
      }
    };
  }, []);

  const stopVideoStream = () => {
    if (videoStreamRef.current) {
      const tracks = videoStreamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
  };

  const calculateAverageMood = (moodData) => {
    const aggregatedMood = moodData.reduce((acc, mood) => {
      for (const [key, value] of Object.entries(mood)) {
        acc[key] = (acc[key] || 0) + value;
      }
      return acc;
    }, {});

    const totalEntries = moodData.length;
    for (const key in aggregatedMood) {
      aggregatedMood[key] /= totalEntries;
    }

    // Return the dominant mood
    return Object.keys(aggregatedMood).reduce((a, b) =>
      aggregatedMood[a] > aggregatedMood[b] ? a : b,
    );
  };

  const sendMoodToAPI = async (mood, age) => {
    try {
      requestCompletedRef.current = true;
      const response = await fetch(`${BACKEND_URL}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, age }),
      });
      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }
      const suggestions = await response.json();
      setSuggestions(suggestions["suggestions"]);
    } catch (error) {
      console.error("Error sending mood to API:", error);
    }
  };

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        width="640"
        height="480"
        autoPlay
        muted
        playsInline
      />
    </div>
  );
};

export default FaceDetection;
