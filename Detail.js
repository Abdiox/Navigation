import React, { useEffect, useState, useRef } from "react";
import { View, Image, StyleSheet, ScrollView, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button, Card, ActivityIndicator, TextInput as PaperInput } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { app } from "./firebase";

const storage = getStorage(app);

const Detail = ({ route, navigation }) => {
    const { note, index, updateNoteInFirestore } = route.params;
    const [updatedNote, setUpdatedNote] = useState(note.note);
    const [imageUrl, setImageUrl] = useState(note.image || "");
    const [location, setLocation] = useState(note.location || {});
    const [localImageUri, setLocalImageUri] = useState("");
    const [uploading, setUploading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [region, setRegion] = useState({ latitude: 55, longitude: 12, latitudeDelta: 20, longitudeDelta: 20 });
    const [markers, setMarkers] = useState([]);

    const mapView = useRef(null);

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

        const updatedData = { note: updatedNote, image: imageUrlToSave, location };
        updateNoteInFirestore(index, updatedData);
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
      // Alert.alert("Location Selected", "Now select an image to associate with this location.", [{ text: "OK", onPress: handleGetImage }]);
      handleGetImage();
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

                        <Button mode="contained" icon="map" onPress={openMap} style={styles.saveButton}>
                            Open Map
                        </Button>

                        {showMap && (
                            <MapView style={styles.map} region={region} onLongPress={handleLongPressMap}>
                                {location.latitude && location.longitude && (
                                    <Marker coordinate={location} title={`Lat: ${location.latitude}, Lng: ${location.longitude}`} />
                                )}
                            </MapView>
                        )}

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
