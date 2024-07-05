"use client"
import { useState } from "react"
import { Button, Box, Typography } from "@mui/material"
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk"

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [dgConnection, setDgConnection] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)

  const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY)
  const handleStart = async () => {
    setIsListening(true)

    // We could have put in the util folder, but as project is small  I have put it there it self
    const dgConnection = deepgram.listen.live({
      model: "nova",
      language: "en-US",
      smart_format: true,
    })

    dgConnection.on(LiveTranscriptionEvents.Open, () => {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        // console.log("Stream -> ", stream)
        const recorder = new MediaRecorder(stream)
        recorder.ondataavailable = (event) => {
          dgConnection.send(event.data)
        }
        // 1000 is time slice
        recorder.start(1000)
        setMediaRecorder(recorder)
      })

      dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
        // console.log("Data -> ", data)
        setTranscript(
          (prev) => prev + " " + data.channel.alternatives[0].transcript
        )
      })
      dgConnection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error(err)
        // We could have use some morgon and other library put that error in some file
        alert("Error is There ", err)
      })
    })

    setDgConnection(dgConnection)
  }

  const handlePause = () => {
    setIsListening(false)
    // console.log("Media recorder -> ", mediaRecorder)
    if (mediaRecorder) {
      mediaRecorder.pause()
      // Finish is because every time stream is creating new record is generated
      //Even after that you can do that
      dgConnection.finish()
      setDgConnection(" ")
    }
    // console.log("Media recorder -> ", mediaRecorder.state)
    // console.log("Dg connection ", dgConnection)
  }

  const handleStop = () => {
    dgConnection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Jai shree Ram")
    })
    setIsListening(false)
    setTranscript("")
    if (mediaRecorder) {
      mediaRecorder.stop()
    }
    if (dgConnection) {
      dgConnection.finish()
    }
    setMediaRecorder(" ")
    setDgConnection(" ")
  }

  return (
    <>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        mt={4}
        mx={4}
        justifyContent={"space-between"}
      >
        <Button
          variant="contained"
          onClick={handleStart}
          disabled={isListening}
          color="success"
        >
          Start Microphone
        </Button>
        <Button
          variant="contained"
          onClick={handlePause}
          disabled={!isListening}
          color="warning"
        >
          Pause Microphone
        </Button>
        <Button
          variant="contained"
          onClick={handleStop}
          disabled={!isListening}
          color="error"
        >
          Stop Microphone
        </Button>
      </Box>
      <Box
        mt={2}
        mx={"auto"}
        sx={{ textAlign: "center" }}
        width={800}
        height={700}
        border={4}
      >
        <Typography variant="h6">Transcript:</Typography>
        {transcript ? (
          <Typography className="text-green-400 font-semibold">
            {transcript}
          </Typography>
        ) : (
          "कुछ इंग्लिश झाड़ो"
        )}
      </Box>
    </>
  )
}
