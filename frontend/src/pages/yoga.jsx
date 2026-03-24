import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { useAuth, useUser } from "@clerk/clerk-react";

const POSE_LIST = [
  "Tree",
  "Chair",
  "Cobra",
  "Warrior",
  "Dog",
  "Shoulderstand",
  "Traingle",
];

const CLASS_INDEX = {
  Chair: 0,
  Cobra: 1,
  Dog: 2,
  No_Pose: 3,
  Shoulderstand: 4,
  Traingle: 5,
  Tree: 6,
  Warrior: 7,
};

const POSE_DETAILS = {
  Tree: {
    image: "/img/yoga/tree.jpg",
    instructions: [
      "Stand tall and ground your standing foot firmly on the floor.",
      "Place the opposite foot on your inner thigh or calf, avoiding the knee.",
      "Bring palms together at chest or raise arms overhead.",
      "Keep your gaze steady and breathe slowly while maintaining balance.",
    ],
  },
  Chair: {
    image: "/img/yoga/chair.jpg",
    instructions: [
      "Stand with feet hip-width apart and inhale arms up beside ears.",
      "Sit hips back as if lowering onto a chair while chest stays lifted.",
      "Keep knees tracking over toes and weight in the heels.",
      "Hold with long breaths and maintain a neutral spine.",
    ],
  },
  Cobra: {
    image: "/img/yoga/cobra.jpg",
    instructions: [
      "Lie on your stomach with palms under shoulders and elbows close.",
      "Press into hands and lift chest without straining the lower back.",
      "Draw shoulders away from ears and broaden the collarbones.",
      "Breathe steadily, then lower down with control.",
    ],
  },
  Warrior: {
    image: "/img/yoga/warrior.jpg",
    instructions: [
      "Start in a lunge and stabilize your front leg.",
      "Lift arms and hinge forward as your back leg extends behind you.",
      "Create a strong T-shape through torso, arms, and back leg.",
      "Engage your core and keep the standing knee softly bent.",
    ],
  },
  Dog: {
    image: "/img/yoga/dog.jpg",
    instructions: [
      "Begin on hands and knees with fingers spread wide.",
      "Lift hips up and back, lengthening spine and hamstrings.",
      "Press firmly through palms while drawing shoulders away from ears.",
      "Keep knees soft if needed and breathe deeply.",
    ],
  },
  Shoulderstand: {
    image: "/img/yoga/shoulderstand.jpg",
    instructions: [
      "Lie on your back and lift legs upward with core engagement.",
      "Support lower back with hands and stack hips above shoulders.",
      "Keep neck neutral and avoid turning your head.",
      "Maintain steady breathing and control when exiting the pose.",
    ],
  },
  Traingle: {
    image: "/img/yoga/traingle.jpg",
    instructions: [
      "Take a wide stance and turn one foot outward.",
      "Reach forward and hinge at the hip over the front leg.",
      "Lower one hand to shin or floor and extend the other arm up.",
      "Lengthen through both sides of your torso and keep chest open.",
    ],
  },
};

const TUTORIALS = [
  "Allow camera access when your browser asks for permission.",
  "Select your pose from the pose list.",
  "Read the instructions and match the reference image.",
  "Click Start Session and hold the pose in frame.",
  "Your skeleton turns green when confidence crosses the threshold.",
];

const CAMERA_FIXES = [
  "Verify browser camera permissions are enabled for this site.",
  "Close other apps or tabs that may be using your camera.",
  "Refresh the page after enabling permissions.",
];

const POINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

const KEYPOINT_CONNECTIONS = {
  nose: ["left_ear", "right_ear"],
  left_ear: ["left_shoulder"],
  right_ear: ["right_shoulder"],
  left_shoulder: ["right_shoulder", "left_elbow", "left_hip"],
  right_shoulder: ["right_elbow", "right_hip"],
  left_elbow: ["left_wrist"],
  right_elbow: ["right_wrist"],
  left_hip: ["left_knee", "right_hip"],
  right_hip: ["right_knee"],
  left_knee: ["left_ankle"],
  right_knee: ["right_ankle"],
};

function drawSegment(ctx, [mx, my], [tx, ty], color) {
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(tx, ty);
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawPoint(ctx, x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function getCenterPoint(landmarks, leftBodyPart, rightBodyPart) {
  const left = tf.gather(landmarks, leftBodyPart, 1);
  const right = tf.gather(landmarks, rightBodyPart, 1);
  return tf.add(tf.mul(left, 0.5), tf.mul(right, 0.5));
}

function getPoseSize(landmarks, torsoSizeMultiplier = 2.5) {
  const hipsCenter = getCenterPoint(
    landmarks,
    POINTS.LEFT_HIP,
    POINTS.RIGHT_HIP,
  );
  const shouldersCenter = getCenterPoint(
    landmarks,
    POINTS.LEFT_SHOULDER,
    POINTS.RIGHT_SHOULDER,
  );
  const torsoSize = tf.norm(tf.sub(shouldersCenter, hipsCenter));

  let poseCenter = getCenterPoint(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP);
  poseCenter = tf.expandDims(poseCenter, 1);
  poseCenter = tf.broadcastTo(poseCenter, [1, 17, 2]);

  const distances = tf.gather(tf.sub(landmarks, poseCenter), 0, 0);
  const maxDist = tf.max(tf.norm(distances, "euclidean", 0));

  return tf.maximum(tf.mul(torsoSize, torsoSizeMultiplier), maxDist);
}

function normalizePoseLandmarks(landmarks) {
  let poseCenter = getCenterPoint(landmarks, POINTS.LEFT_HIP, POINTS.RIGHT_HIP);
  poseCenter = tf.expandDims(poseCenter, 1);
  poseCenter = tf.broadcastTo(poseCenter, [1, 17, 2]);

  const centered = tf.sub(landmarks, poseCenter);
  const poseSize = getPoseSize(centered);

  return tf.div(centered, poseSize);
}

function landmarksToEmbedding(landmarks) {
  return tf.tidy(() => {
    const landmarksTensor = tf.tensor(landmarks);
    const normalizedLandmarks = normalizePoseLandmarks(
      tf.expandDims(landmarksTensor, 0),
    );
    return tf.reshape(normalizedLandmarks, [1, 34]);
  });
}

const CONFIDENCE_THRESHOLD = 0.97;
const DISPLAY_MIRRORED = true;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Yoga = () => {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const detectorRef = useRef(null);
  const classifierRef = useRef(null);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const isPoseCorrectRef = useRef(false);
  const poseStartTimeRef = useRef(0);

  const [selectedPose, setSelectedPose] = useState("Tree");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [poseTime, setPoseTime] = useState(0);
  const [bestPerform, setBestPerform] = useState(0);
  const [poseStats, setPoseStats] = useState({});
  const [statusText, setStatusText] = useState(
    "Load complete model before starting.",
  );
  const [skeletonColor, setSkeletonColor] = useState("rgb(255,255,255)");

  const getUserEmail = () => {
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress;
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress;
    }
    return null;
  };

  const getAuthHeaders = async () => {
    const headers = { "Content-Type": "application/json" };
    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get auth token:", error);
      }
    }
    return headers;
  };

  const loadPoseStats = async () => {
    const userEmail = getUserEmail();
    if (!userEmail || !BACKEND_URL) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${BACKEND_URL}/yoga/stats?user_email=${encodeURIComponent(userEmail)}`,
        {
          method: "GET",
          headers,
        },
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setPoseStats(data.stats || {});
    } catch (error) {
      console.error("Failed to load yoga pose stats:", error);
    }
  };

  const persistPoseStats = async (
    poseName,
    latestPoseTimeSeconds,
    bestHoldSeconds,
  ) => {
    const userEmail = getUserEmail();
    if (!userEmail || !BACKEND_URL) {
      return;
    }

    const payload = {
      user_email: userEmail,
      pose_name: poseName,
      pose_time_seconds: Number(latestPoseTimeSeconds || 0),
      best_hold_seconds: Number(bestHoldSeconds || 0),
    };

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/yoga/stats`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data?.stat?.pose_name) {
        setPoseStats((prev) => ({
          ...prev,
          [data.stat.pose_name]: {
            ...data.stat,
          },
        }));
      }
    } catch (error) {
      console.error("Failed to persist yoga pose stats:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initModels = async () => {
      try {
        await tf.ready();
        await tf.setBackend("webgl");
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER },
        );

        const classifier = await tf.loadLayersModel("/models/yoga/model.json");

        audioRef.current = new Audio("/audio/count.wav");
        audioRef.current.loop = true;

        detectorRef.current = detector;
        classifierRef.current = classifier;

        if (isMounted) {
          setIsModelReady(true);
          setStatusText("Model loaded. Choose a pose and start your session.");
        }
      } catch (error) {
        if (isMounted) {
          setStatusText(
            "Unable to load yoga model. Please refresh and try again.",
          );
        }
      }
    };

    initModels();

    return () => {
      isMounted = false;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (classifierRef.current) {
        classifierRef.current.dispose();
      }

      if (detectorRef.current && detectorRef.current.dispose) {
        detectorRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const selectedPoseStats = poseStats[selectedPose];

    isPoseCorrectRef.current = false;
    poseStartTimeRef.current = 0;
    setPoseTime(Number(selectedPoseStats?.latest_pose_time_seconds || 0));
    setBestPerform(Number(selectedPoseStats?.best_hold_seconds || 0));
    setSkeletonColor("rgb(255,255,255)");
    setStatusText("Pose changed. Press start to begin tracking.");

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [selectedPose, poseStats]);

  useEffect(() => {
    if (isSignedIn) {
      loadPoseStats();
    }
  }, [isSignedIn, user]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const detectPose = async () => {
    if (
      !webcamRef.current ||
      !webcamRef.current.video ||
      webcamRef.current.video.readyState !== 4 ||
      !canvasRef.current ||
      !detectorRef.current ||
      !classifierRef.current
    ) {
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const toDisplayX = (x) => (DISPLAY_MIRRORED ? canvas.width - x : x);

    const poses = await detectorRef.current.estimatePoses(video);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const keypoints = poses?.[0]?.keypoints;

    if (!keypoints || keypoints.length === 0) {
      setStatusText("No pose detected. Step into the camera frame.");
      return;
    }

    let notDetectedCount = 0;

    const input = keypoints.map((keypoint) => {
      const score = keypoint.score ?? 0;
      const pointName = keypoint.name;

      if (score > 0.4) {
        if (pointName !== "left_eye" && pointName !== "right_eye") {
          const currentX = toDisplayX(keypoint.x);
          drawPoint(ctx, currentX, keypoint.y, 7, skeletonColor);
          const connections = pointName
            ? KEYPOINT_CONNECTIONS[pointName]
            : null;

          if (connections) {
            connections.forEach((connection) => {
              const targetIndex = POINTS[connection.toUpperCase()];
              if (targetIndex === undefined) {
                return;
              }
              const targetPoint = keypoints[targetIndex];
              if (!targetPoint) {
                return;
              }
              const targetX = toDisplayX(targetPoint.x);
              drawSegment(
                ctx,
                [currentX, keypoint.y],
                [targetX, targetPoint.y],
                skeletonColor,
              );
            });
          }
        }
      } else {
        notDetectedCount += 1;
      }

      return [keypoint.x, keypoint.y];
    });

    if (notDetectedCount > 4) {
      setSkeletonColor("rgb(255,255,255)");
      isPoseCorrectRef.current = false;
      stopAudio();
      setStatusText("Keep your full body in frame for reliable tracking.");
      return;
    }

    const processedInput = landmarksToEmbedding(input);
    const prediction = classifierRef.current.predict(processedInput);
    const scores = await prediction.data();

    processedInput.dispose();
    prediction.dispose();

    const selectedPoseIndex = CLASS_INDEX[selectedPose];
    const currentScore = scores[selectedPoseIndex] ?? 0;

    if (currentScore > CONFIDENCE_THRESHOLD) {
      if (!isPoseCorrectRef.current) {
        isPoseCorrectRef.current = true;
        poseStartTimeRef.current = Date.now();
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
      }

      const elapsed = (Date.now() - poseStartTimeRef.current) / 1000;
      const roundedElapsed = Number(elapsed.toFixed(1));

      setPoseTime(roundedElapsed);
      setBestPerform((prevBest) => Math.max(prevBest, roundedElapsed));
      setSkeletonColor("rgb(0,255,0)");
      setStatusText("Perfect alignment. Hold steady.");
      return;
    }

    isPoseCorrectRef.current = false;
    setSkeletonColor("rgb(255,255,255)");
    setStatusText("Adjust your pose to match the reference image.");
    stopAudio();
  };

  const startSession = () => {
    if (!isModelReady || intervalRef.current) {
      return;
    }

    setIsSessionActive(true);
    setStatusText("Session started. Match your body with the target pose.");
    intervalRef.current = setInterval(() => {
      detectPose();
    }, 100);
  };

  const stopSession = () => {
    setIsSessionActive(false);
    setStatusText("Session stopped. You can switch pose and restart.");

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    isPoseCorrectRef.current = false;
    setSkeletonColor("rgb(255,255,255)");
    stopAudio();

    if (isSignedIn) {
      persistPoseStats(selectedPose, poseTime, bestPerform);
    }
  };

  const handlePoseSelection = async (newPose) => {
    if (newPose === selectedPose) {
      return;
    }

    if (isSessionActive) {
      stopSession();
    } else if (isSignedIn && (poseTime > 0 || bestPerform > 0)) {
      await persistPoseStats(selectedPose, poseTime, bestPerform);
    }

    setSelectedPose(newPose);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl border border-white/20 bg-blue-200/20 p-6">
          <h1 className="font-zentry text-3xl uppercase md:text-5xl">
            Yoga Trainer
          </h1>
          <p className="mt-2 max-w-3xl font-robert-regular text-sm text-blue-50/90 md:text-base">
            Live pose detection from YogaIntelliJ, integrated into WellSync with
            the same dark visual language.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-black/60 p-5 lg:col-span-2">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="font-general text-xs uppercase tracking-[0.2em] text-blue-50/70">
                  Select Pose
                </label>
                <select
                  value={selectedPose}
                  onChange={(event) => handlePoseSelection(event.target.value)}
                  className="rounded-xl border border-white/20 bg-black px-4 py-2 font-general text-sm text-white outline-none"
                >
                  {POSE_LIST.map((pose) => (
                    <option key={pose} value={pose}>
                      {pose}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={startSession}
                  disabled={!isModelReady || isSessionActive}
                  className="rounded-full bg-violet-50 px-5 py-2 font-general text-xs uppercase tracking-wide text-black transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start Session
                </button>
                <button
                  onClick={stopSession}
                  disabled={!isSessionActive}
                  className="rounded-full border border-white/20 px-5 py-2 font-general text-xs uppercase tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Stop Session
                </button>
              </div>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                <p className="font-general text-xs uppercase text-blue-50/70">
                  Pose Time
                </p>
                <p className="font-zentry text-3xl leading-none">{poseTime}s</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/5 p-3">
                <p className="font-general text-xs uppercase text-blue-50/70">
                  Best Hold
                </p>
                <p className="font-zentry text-3xl leading-none">
                  {bestPerform}s
                </p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/40">
              <Webcam
                ref={webcamRef}
                mirrored
                className="h-auto w-full"
                audio={false}
                videoConstraints={{
                  width: 640,
                  height: 480,
                  facingMode: "user",
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute left-0 top-0 h-full w-full"
              />
            </div>

            <p className="mt-3 font-robert-regular text-sm text-blue-50/90">
              {statusText}
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/20 bg-black/60 p-5">
            <div className="flex h-72 w-full items-center justify-center rounded-xl border border-white/20 bg-black/40 p-2">
              <img
                src={POSE_DETAILS[selectedPose].image}
                alt={`${selectedPose} pose`}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-general text-xs uppercase tracking-[0.2em] text-blue-50/70">
                Pose Instructions
              </h2>
              <ul className="mt-3 space-y-2">
                {POSE_DETAILS[selectedPose].instructions.map((instruction) => (
                  <li
                    key={instruction}
                    className="rounded-lg border border-white/10 bg-white/5 p-2 font-robert-regular text-sm text-white/90"
                  >
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/20 bg-black/60 p-5">
            <h3 className="font-general text-xs uppercase tracking-[0.2em] text-blue-50/70">
              Quick Tutorials
            </h3>
            <ul className="mt-3 space-y-2">
              {TUTORIALS.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 font-robert-regular text-sm text-white/90"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/20 bg-black/60 p-5">
            <h3 className="font-general text-xs uppercase tracking-[0.2em] text-blue-50/70">
              Camera Troubleshooting
            </h3>
            <ul className="mt-3 space-y-2">
              {CAMERA_FIXES.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-white/10 bg-white/5 p-2 font-robert-regular text-sm text-white/90"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Yoga;
