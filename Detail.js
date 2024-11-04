import React, { useEffect, useState, useRef } from "react";
import { View, Image, StyleSheet, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { Button, Card, ActivityIndicator, TextInput as PaperInput, Paragraph } from "react-native-paper";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import MapView, { Marker } from "react-native-maps";
import { Platform } from "react-native";
import { requestAndUpdatePermissions } from "./requestAndUpdatePermissions";
import { app } from "./firebase";

const storage = getStorage(app);
const db = getFirestore(app);

const Detail = ({ route, navigation }) => {
  const { note, index, updateNoteInFirestore } = route.params;
  const [updatedNote, setUpdatedNote] = useState(note.note);
  const [imageUrl, setImageUrl] = useState(note.image || "");
  const [location, setLocation] = useState(note.location || {});
  const [localImageUri, setLocalImageUri] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [region, setRegion] = useState({ latitude: 55, longitude: 12, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
  const [markers, setMarkers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [audioPath, setAudioPath] = useState(note.audio || ""); // New state for audio path
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  const mapView = useRef(null);

  useEffect(() => {
    fetchMarkersFromFirestore();
  }, []);

  const fetchMarkersFromFirestore = async () => {
    const markersCollection = collection(db, "markers");
    const markerSnapshot = await getDocs(markersCollection);
    const markersData = markerSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setMarkers(markersData);
  };

  const uploadImage = async (imageUri) => {
    const imageName = `images/${Date.now()}`;
    const imageRef = ref(storage, imageName);

    try {
      const imgResponse = await fetch(imageUri);
      const blob = await imgResponse.blob();
      const snapshot = await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log("Upload successful, URL:", downloadUrl);
      return downloadUrl;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  const handleSave = async () => {
    setUploading(true);
    let imageUrlToSave = imageUrl;

    if (localImageUri) {
      imageUrlToSave = await uploadImage(localImageUri);
      if (!imageUrlToSave) {
        Alert.alert("Failed to upload image");
        setUploading(false);
        return;
      }
    }

    const updatedData = { note: updatedNote, image: imageUrlToSave, location, audio: audioPath };
    updateNoteInFirestore(index, updatedData);

    // Add marker data to Firestore (as in your existing function)
    if (location.latitude && location.longitude) {
      await addDoc(collection(db, "markers"), {
        latitude: location.latitude,
        longitude: location.longitude,
        imageUrl: imageUrlToSave,
        note: updatedNote,
        audio: audioPath,
      });
    }

    setUploading(false);
    navigation.goBack();
  };

  const openMap = () => {
    setShowMap(true);
  };

  const handleGetImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setLocalImageUri(result.assets[0].uri);
    }
  };

  const handleLongPressMap = (data) => {
    const { latitude, longitude } = data.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
    handleGetImage();
  };

  const handleMarkerPress = (marker) => {
    setSelectedImage(marker.imageUrl);
  };

  //////// AUDIO RECORDING FUNCTIONS ////////

  // New checkPermissions function for web
  const checkPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone permission granted");
    } catch (error) {
      console.error("Microphone permission denied", error);
    }
  };

  const startRecording = async () => {
    await checkPermissions(); // Call the new checkPermissions function

    try {
      const uri = await audioRecorderPlayer.startRecorder();
      setAudioPath(uri); // Set the path where the audio is stored
      setRecording(true);
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      await audioRecorderPlayer.stopRecorder();
      setRecording(false);
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  };

  // Play audio
  const playAudio = async () => {
    try {
      setPlaying(true);
      await audioRecorderPlayer.startPlayer(audioPath);
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.current_position >= e.duration) {
          setPlaying(false);
          audioRecorderPlayer.stopPlayer();
        }
      });
    } catch (error) {
      console.error("Failed to play audio", error);
    }
  };

  // Stop audio playback
  const stopAudio = async () => {
    await audioRecorderPlayer.stopPlayer();
    setPlaying(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Edit Note" />
          <Card.Content>
            <PaperInput
              mode="outlined"
              label="Edit your note"
              value={updatedNote}
              onChangeText={(text) => setUpdatedNote(text)}
              style={styles.input}
            />
            <Button mode="contained" icon="image" onPress={handleGetImage} style={styles.selectImageButton}>
              Select Image
            </Button>
            {uploading ? (
              <ActivityIndicator animating={true} color="#6200ee" style={styles.uploadingIndicator} />
            ) : (
              <Button mode="contained" icon="content-save" onPress={handleSave} style={styles.saveButton}>
                Save
              </Button>
            )}

            <Button mode="contained" icon="map" onPress={openMap} style={styles.saveButton}>
              Open Map
            </Button>

            {showMap && (
              <MapView style={styles.map} region={region} onLongPress={handleLongPressMap}>
                {markers.map((marker) => (
                  <Marker
                    key={marker.id}
                    coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                    onPress={() => handleMarkerPress(marker)}
                  />
                ))}
              </MapView>
            )}

            {selectedImage && (
              <View>
                <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              </View>
            )}

            {location.latitude && location.longitude ? (
              <Card>
                <Card.Content>
                  <Card.Title title="Location" />
                  <Paragraph>
                    Latitude: {location.latitude}, Longitude: {location.longitude}
                  </Paragraph>
                </Card.Content>
              </Card>
            ) : null}
          </Card.Content>
          <Card.Content>
            <Button mode="contained" icon="map" onPress={() => setShowMap(false)} style={styles.saveButton}>
              Close Map
            </Button>
          </Card.Content>

          <Card.Content>
            <Button mode="contained" icon="microphone" onPress={recording ? stopRecording : startRecording} style={styles.saveButton}>
              {recording ? "Stop Recording" : "Start Recording"}
            </Button>

            <Button mode="contained" icon="play" onPress={playing ? stopAudio : playAudio} style={styles.saveButton} disabled={!audioPath}>
              {playing ? "Stop Audio" : "Play Audio"}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: 400,
  },
  scrollContainer: {
    padding: 20,
  },
  container: {
    flex: 1,
  },
  input: {
    marginBottom: 20,
  },
  saveButton: {
    marginVertical: 10,
  },
  selectImageButton: {
    marginVertical: 10,
  },
  uploadingIndicator: {
    marginTop: 20,
  },
  selectedImage: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
});

export default Detail;
