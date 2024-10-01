import fetch from 'node-fetch';
import express from 'express';
import dotenv from 'dotenv';
import { XMLParser } from 'fast-xml-parser';
import cors from 'cors';
import https from 'https';
import path from 'path';

dotenv.config();

const parser = new XMLParser();
const app = express();
app.use(cors());

const port = 10000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route to serve signup.html on root access
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

//Endpoint to fetch status.xml
app.get('/fetch-status', async (req, res) => {
  try {
    console.log('Received request for /fetch-status'); // Log for debugging
    // For Room Kit Mini
    const response = await fetch('https://192.168.10.167/status.xml', {
      headers: {
        'Authorization': 'Basic ' + Buffer.from('Test123:admin@123').toString('base64'),
      },
      agent: new https.Agent({
        rejectUnauthorized: false, // Disable SSL verification
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const xmlText = await response.text();
    const jsonObj = parser.parse(xmlText);

    console.log('Parsed XML:', jsonObj);
    
    //Audio Devices Report
    const handsetUSBReport = jsonObj?.Status?.Audio?.Devices?.HandsetUSB?.ConnectionStatus;
    const headsetUSBReport = jsonObj?.Status?.Audio?.Devices?.HeadsetUSB?.ConnectionStatus;
    const microphoneReport = jsonObj?.Status?.Audio?.Input?.Connectors?.Microphone?.ConnectionStatus;
    const noiseRemoval = jsonObj?.Status?.Audio?.Microphones?.NoiseRemoval;
    const voiceActivityDetector = jsonObj?.Status?.Audio?.Microphones?.VoiceActivityDetector?.Activity;

    // Cameras Report
    const cameraReport = jsonObj?.Status?.Cameras;
    const cameraConnectionStatus = cameraReport?.Camera?.Connected;
    //const cameraFrameRate = cameraReport?.Camera?.Framerate;
    const cameraLightningConditions = cameraReport?.Camera?.LightingConditions;
    const speakerTracking = cameraReport?.SpeakerTrack?.Availability;
    const speakerTrackingStatus = cameraReport?.SpeakerTrack?.Status;

    // Peripherals Report
    const peripheralsReport = jsonObj?.Status?.Peripherals?.ConnectedDevice;
    const deviceName = peripheralsReport.Name;
    const deviceStatus = peripheralsReport.Status;
    //const deviceType = jsonObj?.Status?.Peripherals?.ConnectedDevice?.Type;

    // Proximity Report
    const proximityReport = jsonObj?.Status?.Proximity?.Services?.Availability;

    // Room Analytics Report
    const roomAnalyticsReport = jsonObj?.Status?.RoomAnalytics;
    const peopleCount = roomAnalyticsReport.PeopleCount;
    const peopleCapacity = peopleCount.Capacity;
    const peopleCurrent = peopleCount.Current;
    const ambientNoiseLevel = roomAnalyticsReport.AmbientNoise.Level.A;
    const soundLevel = roomAnalyticsReport.Sound.Level.A;

    // System Unit Details
    const systemUnitDetails = jsonObj?.Status?.SystemUnit;
    const systemUnitName = systemUnitDetails.BroadcastName;
    const productId = systemUnitDetails.ProductId;

    // Video Report
    const videoReport = jsonObj?.Status?.Video;
    const videoReportInput = videoReport.Input;
    const airplayStatus = videoReport.Input.AirPlay.Status;
    
    const mainVideoSource = videoReportInput.MainVideoSource;
    const miracastStatus = videoReportInput.Miracast.Status;

    const videoReportOutput = videoReport.Output;
    const connectorConnectionStatus = videoReportOutput.Connector.Connected;

    const connectorResolution = videoReportOutput.Connector.Resolution;
    const connectorResolutionHeight = connectorResolution.Height;
    const connectorResolutionWidth = connectorResolution.Width;
    const connectorResolutionRefreshRate = connectorResolution.RefreshRate;
    const monitorName = videoReportOutput?.Monitor?.ModelName;
    const webcamMode = videoReportOutput.Webcam.Mode;
    const webcamStatus = videoReportOutput.Webcam.Status;

    // Check Call Quality
    let callReport = ''; // Set callReport to empty by default
    let score = 10;

    if (microphoneReport === 'unknown') {
      callReport += 'microphone has issues';
      score -=1;
    }
    if (noiseRemoval === 'off' || voiceActivityDetector === 'False') {
      callReport += 'noise removal or voice activity detector did not work';
      score -=1;
    }
    if (cameraLightningConditions !== 'good' || cameraLightningConditions !== 'backlight') {
      callReport += 'camera lighting conditions are not good';
      score -=1;
    }
    if (speakerTrackingStatus !== 'available') {
      callReport += 'speaker tracking is not available';
      score -=1;
    }
    if (peopleCurrent > peopleCapacity) {
      callReport += 'room is overcrowded';
      score -=1;
    }
    if (ambientNoiseLevel > 40 && ambientNoiseLevel < 50) {
      callReport += 'ambient noise level is not good';
      score -=0.5;
    }
    if (ambientNoiseLevel > 50) {
      callReport += 'ambient noise level is very high';
      score -=1;
    }
    if (proximityReport !== 'available') {
      callReport += 'proximity services are not available';
      score -=1;
    }
    if (connectorConnectionStatus !== 'True') {
      callReport += 'connector is not connected';
      score -=1;
    }
    
    let finalStatus = '';
    if(score >= 5 && score <= 8){
      finalStatus = "ok ✔️";
    } else if(score <=4){
      finalStatus = "not ok ❌";
    }else{ 
      finalStatus = "good ✅";
    }
    res.json({ productId, systemUnitName, handsetUSBReport, headsetUSBReport, microphoneReport, noiseRemoval, voiceActivityDetector, cameraConnectionStatus, cameraLightningConditions, speakerTracking, speakerTrackingStatus, deviceName, deviceStatus, proximityReport, ambientNoiseLevel, soundLevel, peopleCapacity, peopleCurrent, airplayStatus, mainVideoSource, airplayStatus, miracastStatus, connectorConnectionStatus, connectorResolutionHeight, connectorResolutionWidth, connectorResolutionRefreshRate, monitorName, webcamMode, webcamStatus, finalStatus, score});
  }catch (error) {
    console.error('Error fetching status.xml', error);
    res.status(500).send('Error fetching status.xml');
  }
});

app.listen(port, () => {
  console.log(`Server running now at ${port}`);
});