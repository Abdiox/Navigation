import React, { useEffect, useState } from "react";
import { View, TextInput, Image, StyleSheet, Text, Alert, Platform, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, ref } from "firebase/storage";
import { Button, Card, ActivityIndicator, TextInput as PaperInput } from "react-native-paper";
import { app, storage } from "./firebase";

const Detail = ({ route, navigation }) => {
  const { note, index, updateNoteInFirestore } = route.params;
  const [updatedNote, setUpdatedNote] = useState(note.note);
  const [imageUrl, setImageUrl] = useState(note.image || "");
  const [localImageUri, setLocalImageUri] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          alert("Sorry, we need camera roll permissions to make this work!");
        }
      }
    })();
  }, []);

  const uploadImage = async (imageUri) => {
    const storage = getStorage(app);
    const imageName = `images/${Date.now()}`;
    const ref = storageRef(storage, imageName);

    try {
      const imgResponse = await fetch(imageUri);
      const blob = await imgResponse.blob();
      const snapshot = await uploadBytes(ref, blob);
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

    const updatedData = { note: updatedNote, image: imageUrlToSave };
    updateNoteInFirestore(index, updatedData);
    setUploading(false);
    navigation.goBack();
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

  async function downloadImageUrl() {
    const imageName = "1728308860852"; // Eksempel: Dette skal være det præcise filnavn
    try {
      const imageRef = ref(storage, `images/${imageName}`);
      const url = await getDownloadURL(imageRef);
      setImageUrl(url);
    } catch (error) {
      alert("Fejl i Image download: " + error.message);
    }
  }

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

            <Button mode="contained" icon="download" onPress={downloadImageUrl} style={styles.selectImageButton}>
              Download Image
            </Button>
            {localImageUri ? (
              <Image style={styles.image} source={{ uri: localImageUri }} />
            ) : imageUrl ? (
              <Image style={styles.image} source={{ uri: imageUrl }} />
            ) : null}
            {uploading ? (
              <ActivityIndicator animating={true} color="#6200ee" style={styles.uploadingIndicator} />
            ) : (
              <Button mode="contained" icon="content-save" onPress={handleSave} style={styles.saveButton}>
                Save
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
    width: "100%",
    height: 200,
    marginVertical: 20,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 8,
  },
  uploadingIndicator: {
    marginVertical: 20,
  },
});

export default Detail;
