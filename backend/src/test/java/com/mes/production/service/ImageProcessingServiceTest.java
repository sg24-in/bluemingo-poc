package com.mes.production.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class ImageProcessingServiceTest {

    private ImageProcessingService imageProcessingService;
    private byte[] testImageData;

    @BeforeEach
    void setUp() throws Exception {
        imageProcessingService = new ImageProcessingService();

        // Create a simple test image
        BufferedImage testImage = new BufferedImage(200, 150, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = testImage.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 100, 150);
        g.setColor(Color.RED);
        g.fillRect(100, 0, 100, 150);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(testImage, "png", baos);
        testImageData = baos.toByteArray();
    }

    @Test
    @DisplayName("Should convert image to grayscale")
    void convertToGrayscale_ValidImage_ReturnsGrayscale() throws Exception {
        byte[] result = imageProcessingService.convertToGrayscale(testImageData);

        assertNotNull(result);
        assertTrue(result.length > 0);

        BufferedImage grayscale = ImageIO.read(new ByteArrayInputStream(result));
        assertNotNull(grayscale);
        assertEquals(200, grayscale.getWidth());
        assertEquals(150, grayscale.getHeight());
    }

    @Test
    @DisplayName("Should resize image to target dimensions")
    void resizeImage_ValidDimensions_ReturnsResized() throws Exception {
        byte[] result = imageProcessingService.resizeImage(testImageData, 100, 75);

        BufferedImage resized = ImageIO.read(new ByteArrayInputStream(result));
        assertNotNull(resized);
        assertEquals(100, resized.getWidth());
        assertEquals(75, resized.getHeight());
    }

    @Test
    @DisplayName("Should generate thumbnail maintaining aspect ratio - landscape")
    void generateThumbnail_LandscapeImage_MaintainsRatio() throws Exception {
        byte[] result = imageProcessingService.generateThumbnail(testImageData, 100);

        BufferedImage thumbnail = ImageIO.read(new ByteArrayInputStream(result));
        assertNotNull(thumbnail);
        assertEquals(100, thumbnail.getWidth());
        assertEquals(75, thumbnail.getHeight()); // 200:150 = 100:75
    }

    @Test
    @DisplayName("Should generate thumbnail for portrait image")
    void generateThumbnail_PortraitImage_MaintainsRatio() throws Exception {
        // Create portrait image (100x200)
        BufferedImage portrait = new BufferedImage(100, 200, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = portrait.createGraphics();
        g.setColor(Color.GREEN);
        g.fillRect(0, 0, 100, 200);
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(portrait, "png", baos);

        byte[] result = imageProcessingService.generateThumbnail(baos.toByteArray(), 100);

        BufferedImage thumbnail = ImageIO.read(new ByteArrayInputStream(result));
        assertNotNull(thumbnail);
        assertEquals(100, thumbnail.getHeight());
        assertEquals(50, thumbnail.getWidth()); // 100:200 = 50:100
    }

    @Test
    @DisplayName("Should get image metadata")
    void getImageMetadata_ValidImage_ReturnsMetadata() {
        ImageProcessingService.ImageMetadata metadata = imageProcessingService.getImageMetadata(testImageData);

        assertNotNull(metadata);
        assertEquals(200, metadata.width());
        assertEquals(150, metadata.height());
        assertTrue(metadata.sizeBytes() > 0);
    }

    @Test
    @DisplayName("Should throw for invalid image data on grayscale")
    void convertToGrayscale_InvalidData_ThrowsException() {
        byte[] invalidData = "not an image".getBytes();
        assertThrows(RuntimeException.class, () -> imageProcessingService.convertToGrayscale(invalidData));
    }

    @Test
    @DisplayName("Should throw for invalid image data on resize")
    void resizeImage_InvalidData_ThrowsException() {
        byte[] invalidData = "not an image".getBytes();
        assertThrows(RuntimeException.class, () -> imageProcessingService.resizeImage(invalidData, 100, 100));
    }

    @Test
    @DisplayName("Should throw for invalid image data on metadata")
    void getImageMetadata_InvalidData_ThrowsException() {
        byte[] invalidData = "not an image".getBytes();
        assertThrows(RuntimeException.class, () -> imageProcessingService.getImageMetadata(invalidData));
    }
}
