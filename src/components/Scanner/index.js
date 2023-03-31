import React, {useEffect, useRef, useState}  from 'react';
import * as BlinkIDSDK from '@microblink/blinkid-in-browser-sdk';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MICROBLINK_LICENSE_KEY } from '../../Utils/Common';
import { Button, Header, Loading, Steps } from '../../components';

const wizard = [ {number: 1, active : true}, {number: 2, active : false}, {number: 3, active : false}]

const Scanner = ()=> {

	const msg = useRef(null)
	const loadProgress = useRef(null)
	const cameraFeedRef = useRef(null);
	const cameraFeedbackRef = useRef(null);
	const cameraGuides = useRef(null)
	const [ scannedResult, setScannedResult ] = useState({
		nombre:'',
		sexo:'',
		dni:''
	})
	const [ progress, setProgress] = useState(0)
	const [ next, setNext ] = useState(false)
	const [uiHelpers,setUiHelpers]=useState({
		initialMessageEl:null,
		progressEl: null,
        cameraFeed: null,
		cameraFeedback:null,
		drawContext:null,
		scanFeedback:null,
	})
    const [loading,setLoading] = useState(false)
	const { initialMessageEl,progressEl,cameraFeed,cameraFeedback,scanFeedback,drawContext} = uiHelpers

	const onLoadNext = () => {
		console.log(uiHelpers)
		
  	}

/**
 * Check browser support, customize settings and load WASM SDK.
 */
    async function main() {
    // Check if browser has proper support for WebAssembly
        if (!BlinkIDSDK.isBrowserSupported()) {
                console.log('ERROR BROWSER SUPPORT')
                toast.error('Error. Ingrese datos manualmente')
            return;
        }
        // 1. You can request a free trial license key, after you register, at Microblink Developer Hub
        const licenseKey = MICROBLINK_LICENSE_KEY;

        // 2. Create instance of SDK load settings with your license key
        const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licenseKey);

        // [OPTIONAL] Change default settings
        // Show or hide hello message in browser console when WASM is successfully loaded
        loadSettings.allowHelloMessage = true;
        // In order to provide better UX, display progress bar while loading the SDK
        loadSettings.loadProgressCallback = (progress) =>
        setProgress(progress)
        // Set relative or absolute location of the engine, i.e. WASM and support JS files
        //loadSettings.engineLocation = "https://soporte.abs-ti.com:9025/resources/resources/";
        loadSettings.engineLocation = "https://unpkg.com/@microblink/blinkid-in-browser-sdk@5.20.0/resources/";
        
        // Set absolute location of the worker file
        // IMPORTANT: function getWorkerLocation is a workaround for the CodePen since native Web Workers are not supported
        //loadSettings.workerLocation = await getWorkerLocation('https://soporte.abs-ti.com:9025/resources/BlinkIDWasmSDK.worker.min.js');
        //loadSettings.workerLocation = await getWorkerLocation('http://localhost:3000/resources/BlinkIDWasmSDK.worker.min.js');
        loadSettings.workerLocation = await getWorkerLocation('https://unpkg.com/@microblink/blinkid-in-browser-sdk@5.20.0/resources/BlinkIDWasmSDK.worker.min.js');
        
        // 3. Load SDK
        BlinkIDSDK.loadWasmModule(loadSettings).then(
            (sdk) => {
                
                document.getElementById("screen-initial")?.classList.add("hidden");
                document.getElementById("screen-start")?.classList.remove("hidden");
                document
                    .getElementById("start-scan")
                    ?.addEventListener("click", (ev) => {
                        ev.preventDefault();
                        startScan(sdk);
                    });
            },
            (error) => {
                console.log('ERROR MODULE')
                toast.error('Error. Ingrese datos manualmente')
            }
        )
        .catch((err) =>{
            console.log("ERROR LOADING WASM MODULE GOES HERE")
            console.error(err)
            console.log(JSON.stringify(err))
        } )
    }
/**
 * Scan single side of identity document with web camera.
 */
    async function startScan(sdk) {
        document.getElementById("screen-start")?.classList.add("hidden");
        document.getElementById("screen-scanning")?.classList.remove("hidden");
        // 1. Create a recognizer objects which will be used to recognize single image or stream of images.
        //
        // Generic ID Recognizer - scan various ID documents
        // ID Barcode Recognizer - scan barcodes from various ID documents
        const genericIDRecognizer = await BlinkIDSDK.createBlinkIdRecognizer(sdk);
        const idBarcodeRecognizer = await BlinkIDSDK.createIdBarcodeRecognizer(sdk);
        
        // [OPTIONAL] Create a callbacks object that will receive recognition events, such as detected object location etc.
        const callbacks = {
            onQuadDetection: (quad) => drawQuad(quad),
            onDetectionFailed: () => updateScanFeedback("El proceso de escaneo falló", true),
        };
        // 2. Create a RecognizerRunner object which orchestrates the recognition with one or more
        //    recognizer objects.
        const recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
            // SDK instance to use
            sdk,
            // List of recognizer objects that will be associated with created RecognizerRunner object
            [genericIDRecognizer, idBarcodeRecognizer],
            // [OPTIONAL] Should recognition pipeline stop as soon as first recognizer in chain finished recognition
            false,
            // [OPTIONAL] Callbacks object that will receive recognition events
            callbacks
        );
        // 3. Create a VideoRecognizer object and attach it to HTMLVideoElement that will be used for displaying the camera feed
        const videoRecognizer = await BlinkIDSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
            cameraFeedRef.current,
            recognizerRunner
        );

        // 4. Start the recognition and await for the results
        const processResult = await videoRecognizer.recognize();
        // 5. If recognition was successful, obtain the result and display it
        if (processResult !== BlinkIDSDK.RecognizerResultState.Empty) {
            const idBarcodeResult = await idBarcodeRecognizer.getResult();
            if (idBarcodeResult.state !== BlinkIDSDK.RecognizerResultState.Empty) {
               
                if( idBarcodeResult.sex == '' || idBarcodeResult.firstName == '' || idBarcodeResult.documentNumber =='' ){
                    toast.warning('Error. Intente de nuevo')
                    setNext(false)
                }
                else{
                    setScannedResult((prevState)=>({
                        ...prevState,
                        sexo: idBarcodeResult.sex,
                        nombre: idBarcodeResult.firstName + ' ' + idBarcodeResult.lastName,
                        dni: idBarcodeResult.documentNumber
                    }))
                    setNext(true)
                }
            }
        } else {
            console.log('ERROR SCANNING')
            toast.error('Error. Ingrese datos manualmente')
        }
        // 7. Release all resources allocated on the WebAssembly heap and associated with camera stream
        // Release browser resources associated with the camera stream
        videoRecognizer?.releaseVideoFeed();
        // Release memory on WebAssembly heap used by the RecognizerRunner
        recognizerRunner?.delete();
        // Release memory on WebAssembly heap used by the recognizer
        genericIDRecognizer?.delete();
        idBarcodeRecognizer?.delete();
        // Clear any leftovers drawn to canvas
        clearDrawCanvas();
        // Hide scanning screen and show scan button again
        document.getElementById("screen-start")?.classList.remove("hidden");
        document.getElementById("screen-scanning")?.classList.add("hidden");
    }
/**
 * Utility functions for drawing detected quadrilateral onto canvas.
 */
    function drawQuad(quad) {
        clearDrawCanvas();
        // Based on detection status, show appropriate color and message
        setupColor(quad);
        setupMessage(quad);
        applyTransform(quad.transformMatrix);
        drawContext.beginPath();
        drawContext.moveTo(quad.topLeft.x, quad.topLeft.y);
        drawContext.lineTo(quad.topRight.x, quad.topRight.y);
        drawContext.lineTo(quad.bottomRight.x, quad.bottomRight.y);
        drawContext.lineTo(quad.bottomLeft.x, quad.bottomLeft.y);
        drawContext.closePath();
        drawContext.stroke();
    }
    /**
     * This function will make sure that coordinate system associated with detectionResult
     * canvas will match the coordinate system of the image being recognized.
     */
    function applyTransform(transformMatrix) {
        const canvasAR = cameraFeedback.width / cameraFeedback.height;
        const videoAR = cameraFeed.videoWidth / cameraFeed.videoHeight;
        let xOffset = 0;
        let yOffset = 0;
        let scaledVideoHeight = 0;
        let scaledVideoWidth = 0;
        if (canvasAR > videoAR) {
            // pillarboxing: https://en.wikipedia.org/wiki/Pillarbox
            scaledVideoHeight = cameraFeedback.height;
            scaledVideoWidth = videoAR * scaledVideoHeight;
            xOffset = (cameraFeedback.width - scaledVideoWidth) / 2.0;
        } else {
            // letterboxing: https://en.wikipedia.org/wiki/Letterboxing_(filming)
            scaledVideoWidth = cameraFeedback.width;
            scaledVideoHeight = scaledVideoWidth / videoAR;
            yOffset = (cameraFeedback.height - scaledVideoHeight) / 2.0;
        }
        // first transform canvas for offset of video preview within the HTML video element (i.e. correct letterboxing or pillarboxing)
        drawContext.translate(xOffset, yOffset);
        // second, scale the canvas to fit the scaled video
        drawContext.scale(
            scaledVideoWidth / cameraFeed.videoWidth,
            scaledVideoHeight / cameraFeed.videoHeight
        );
        // finally, apply transformation from image coordinate system to
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setTransform
        drawContext.transform(
            transformMatrix[0],
            transformMatrix[3],
            transformMatrix[1],
            transformMatrix[4],
            transformMatrix[2],
            transformMatrix[5]
        );
    }
    function clearDrawCanvas() {
        cameraFeedback.width = cameraFeedback.clientWidth;
        cameraFeedback.height = cameraFeedback.clientHeight;
        drawContext.clearRect(0, 0, cameraFeedback.width, cameraFeedback.height);
    }
    function setupColor(displayable) {
        let color = "#FFFF00FF";
        if (displayable.detectionStatus === 0) {
            color = "#FF0000FF";
        } else if (displayable.detectionStatus === 1) {
            color = "#00FF00FF";
        }
        drawContext.fillStyle = color;
        drawContext.strokeStyle = color;
        drawContext.lineWidth = 5;
    }

    function setupMessage(displayable) {
        switch (displayable.detectionStatus) {
            case BlinkIDSDK.DetectionStatus.Fail:
                updateScanFeedback("Escaneando documento...");
                break;
            case BlinkIDSDK.DetectionStatus.Success:
            case BlinkIDSDK.DetectionStatus.FallbackSuccess:
                updateScanFeedback("Detección exitosa");
                break;
            case BlinkIDSDK.DetectionStatus.CameraAtAngle:
                updateScanFeedback("Ajuste el ángulo");
                break;
            case BlinkIDSDK.DetectionStatus.CameraTooHigh:
                updateScanFeedback("Mueva el documento más cerca");
                break;
            case BlinkIDSDK.DetectionStatus.CameraTooNear:
            case BlinkIDSDK.DetectionStatus.DocumentTooCloseToEdge:
            case BlinkIDSDK.DetectionStatus.Partial:
                updateScanFeedback("Mueva el documento más lejos");
                break;
            default:
                console.warn(
                    "Unhandled detection status!",
                    displayable.detectionStatus
                );
        }
    }
    let scanFeedbackLock = false;
    /**
     * The purpose of this function is to ensure that scan feedback message is
     * visible for at least 1 second.
     */
    function updateScanFeedback(message, force) {
        if (scanFeedbackLock && !force) {
            return;
        }
        scanFeedbackLock = true;
        cameraGuides.current.innerText = message;
        window.setTimeout(() => (scanFeedbackLock = false), 1000);
    }

    function getWorkerLocation(path) {  
    return new Promise((resolve) => {
        window.fetch(path)
        .then(response => response.text())
        .then(data => {
            const blob = new Blob( [ data ], { type: "application/javascript" } );
            const url = URL.createObjectURL( blob );
            resolve(url);
        })
        .catch((err) =>{
            console.log("ERROR GETTING WORKER LOCATION GOES HERE")
            console.log(JSON.stringify(err))
            console.error(err)
        } )
    });
    }

    useEffect(()=>{

        const {cameraFeed,cameraFeedback,scanFeedback,drawContext} = uiHelpers

        if( 
            cameraFeed != null 
            &&
            cameraFeedback != null 
            && 
            scanFeedback != null 
            && 
            drawContext != null
        ){
            main()
            setLoading(false)
        }
    },[uiHelpers])

    useEffect(() => {
        setLoading(true)
        setUiHelpers((prev)=>({
            ...prev,
            initialMessageEl:msg.current,
            progressEl: loadProgress.current,
            cameraFeed:cameraFeedRef.current,
            cameraFeedback:cameraFeedbackRef.current,
            scanFeedback:cameraGuides.current,
            drawContext:(cameraFeedbackRef.current).getContext("2d")
        }))
    }, []);

    useEffect(()=>{
        console.log('UI HELPERS - DEVUELVE RESULTADOS DEL ESCANEO')
        console.log(uiHelpers)
    },[uiHelpers])

		return (
			<>
				<ToastContainer />
				<Header/>
                {
                    loading ? <Loading/>
                    :
					<div className="colored-bg-container">
						<div className='auto-container-bg'>
							<div className="center-container-def">
								<div className="video-microblink">
								{
									next ?
									<>
									<div className="center-container-def" style={{marginTop: 25}}>
										<h4> <strong style={{color:'#2B2B2B'}}>¡Escaneo éxitoso!</strong></h4>
										<p className='data-pdf417'> {scannedResult.nombre} </p>
										<p className='data-pdf417'> Sexo: {scannedResult.sexo}</p>
										<p className='data-pdf417'> DNI: {scannedResult.dni}</p>
									</div>
									</>
									: 
									<div className='body-scan'>
                                        <div id="screen-initial">
                                            <h2 className='loading-src' ref={msg}>Cargando...</h2>
                                            <progress ref={loadProgress} value={progress}></progress>
                                        </div>
                                        <div id="screen-start" className="hidden">
                                            <a href="#" id="start-scan" className='start-scan-anchor'>Iniciar</a>
                                        </div>
                                        <div id="screen-scanning" className="hidden">
                                            <video ref={cameraFeedRef}></video>
                                            <canvas ref={cameraFeedbackRef} id="camera-feedback" />
                                            <p className='advice-scanner' ref={cameraGuides} id="camera-guides">
                                                Apunte la cámara hacia el frente del documento
                                            </p>
                                        </div>
                                    </div>
								}
							</div>
                                {
                                    next ?
                                    <div className="center-container-def" style={{marginTop:'2rem'}}>
                                        <Button name='Siguiente' className='form-button-end' onClick={onLoadNext}/>
                                    </div>
                                    :
                                    <div className="center-container-def" style={{marginTop:'2rem'}}>
                                        <h4 className='center-container-def-text'>Encuadrá el <strong style={{color:'#2B2B2B'}}>CODIGO DE BARRAS</strong> de tu DNI en el marco superior</h4>
                                    </div> 
                                } 
						</div>
						{/* <div className="center-container-def">
                            <span className='sub-link-option'>Carga de datos manual</span>
                        </div> */}
					</div>
					<Steps stepsTotal={ wizard } />
				</div>
                }
			</>
		);
	  }

	
export default Scanner

