import React, { useEffect, useState, useRef } from "react";
import { View, Image, StyleSheet, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { Button, Card, ActivityIndicator, TextInput as PaperInput, Paragraph } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { Audio } from "expo-av";
import { Platform } from "react-native";
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
  const [audioUrl, setAudioUrl] = useState(note.audio || "");
  const [localAudioUri, setLocalAudioUri] = useState("");
  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null); // State to manage audio playback

  const [showMap, setShowMap] = useState(false);
  const [region, setRegion] = useState({ latitude: 55, longitude: 12, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
  const [markers, setMarkers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const mapView = useRef(null);

  useEffect(() => {
    fetchMarkersFromFirestore();
  }, []);

  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  const fetchMarkersFromFirestore = async () => {
    const markersCollection = collection(db, "markers");
    const markerSnapshot = await getDocs(markersCollection);
    const markersData = markerSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setMarkers(markersData);
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      setRecording(recording);
    } catch (error) {
      console.error("Failed to start recording", error);
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setLocalAudioUri(uri);
        setRecording(null); // Tøm optagelsesstatus
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
  };

  const playAudio = async () => {
    if (audioUrl) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
        setSound(sound);
        await sound.playAsync();
      } catch (error) {
        console.error("Failed to play audio", error);
      }
    } else {
      Alert.alert("No audio available to play");
    }
  };

  const uploadAudio = async (audioUri) => {
    const audioName = `audio/${Date.now()}.m4a`;
    const audioRef = ref(storage, audioName);

    try {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const snapshot = await uploadBytes(audioRef, blob);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error("Audio upload failed:", error);
      return null;
    }
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
    let audioUrlToSave = audioUrl;

    if (localAudioUri) {
      audioUrlToSave = await uploadAudio(localAudioUri);
      if (!audioUrlToSave) {
        Alert.alert("Failed to upload audio");
        setUploading(false);
        return;
      }
    }

    if (localImageUri) {
      imageUrlToSave = await uploadImage(localImageUri);
      if (!imageUrlToSave) {
        Alert.alert("Failed to upload image");
        setUploading(false);
        return;
      }
    }

    const updatedData = { note: updatedNote, image: imageUrlToSave, audio: audioUrlToSave, location };
    updateNoteInFirestore(index, updatedData);

    if (location.latitude && location.longitude) {
      await addDoc(collection(db, "markers"), {
        latitude: location.latitude,
        longitude: location.longitude,
        imageUrl: imageUrlToSave,
        note: updatedNote,
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
            <Button mode="contained" icon="microphone" onPress={recording ? stopRecording : startRecording} style={styles.selectImageButton}>
              {recording ? "Stop Recording" : "Start Recording"}
            </Button>
            <Button mode="contained" icon="play" onPress={playAudio} style={styles.playButton}>
              Play Audio
            </Button>
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
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: 300,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  card: {
    padding: 16,
    borderRadius: 8,
    elevation: 4,
    backgroundColor: "#ffffff",
  },
  input: {
    marginBottom: 20,
  },
  selectImageButton: {
    marginVertical: 20,
    backgroundColor: "#6200ee",
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: "cover",
    marginVertical: 10,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 8,
  },
  uploadingIndicator: {
    marginVertical: 20,
  },
  playButton: {
    backgroundColor: "#4caf50",
    marginVertical: 10,
  },
});

export default Detail;
