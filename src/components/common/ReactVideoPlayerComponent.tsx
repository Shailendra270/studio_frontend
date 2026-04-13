import {useState} from 'react'

const ReactVideoPlayerComponent = () => {
    const [imageUrl, setImageUrl] = useState("");
  const [xCoordinate, setXCoordinate] = useState(0);
  const [yCoordinate, setYCoordinate] = useState(0);
  const [x1Coordinate, setX1Coordinate] = useState(0.1);
  const [y1Coordinate, setY1Coordinate] = useState(0.1);
  const [x2Coordinate, setx2Coordinate] = useState(8.5);
  const [y2Coordinate, setY2Coordinate] = useState(15.14);
  const [imageFlag, setImageFlag] = useState(false);
  const [soundFlag, setSoundFlag] = useState(false);

  
  return (
     <>
              <div
                className={s.VideoPlayerWrapper}
                id="video-player"
                style={{ height: firstRef.current?.height, width: firstRef.current?.width }}
              >
                <Reactplayer
                  className={s.VideoPlayerComponent}
                  folders={folders}
                  getVideoCoordinates={getVideoCoordinates}
                  duration={duration}
                  setDuration={setDuration}
                  totalDuration={totalDuration}
                  setTotalDuration={setTotalDuration}
                  playerRef={playerRef}
                  seekTime={seekTime}
                  setSeekTime={setSeekTime}
                  timelineControl={timelineControl}
                  videoUrl={videoUrl}
                  timeline={timeline}
                  setVideoUrl={setVideoUrl}
                  timeLineDuration={timeLineDuration}
                  highDuration={highDuration}
                  setHighDuration={setHighDuration}
                  totalHiDuration={totalHiDuration}
                  setTotalHighDuration={setTotalHighDuration}
                  setSingleAudio={setSingleAudio}
                  singleAudio={singleAudio}
                  soundFlag={soundFlag}
                  videoIntesity={videoIntesity}
                  intensity={intensity}
                  selectedOverlay={selectedOverlay}
                  onResizeFun={onResizeFun}
                  onDrag={onDrag}
                  imageFlag={imageFlag}
                  rndWidth={rndWidth}
                  rndHight={rndHight}
                  xCoordinate={xCoordinate}
                  yCoordinate={yCoordinate}
                  imageUrl={imageUrl}
                  selectedImage={selectedImage}
                  videoStart={videoStart}
                  setVideoStart={setVideoStart}
                  showOverLay={showOverLay}
                  setshowOverLay={setshowOverLay}
                  mute={mute}
                  setMute={setMute}
                />
              </div>
            </>
  )
}

export default ReactVideoPlayerComponent