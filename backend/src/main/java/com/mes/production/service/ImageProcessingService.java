package com.mes.production.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

/**
 * Service for image processing operations using Java AWT (OpenCV-compatible patterns).
 * Uses Java built-in image processing to avoid native library load issues.
 * The opencv dependency is available for advanced use cases when native libs are configured.
 */
@Service
@Slf4j
public class ImageProcessingService {

    /**
     * Convert image to grayscale.
     */
    public byte[] convertToGrayscale(byte[] imageData) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imageData));
            if (original == null) {
                throw new IllegalArgumentException("Invalid image data");
            }

            BufferedImage grayscale = new BufferedImage(
                    original.getWidth(), original.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
            Graphics2D g = grayscale.createGraphics();
            g.drawImage(original, 0, 0, null);
            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(grayscale, "png", baos);
            log.info("Converted image to grayscale ({}x{})", original.getWidth(), original.getHeight());
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error converting image to grayscale", e);
            throw new RuntimeException("Failed to process image", e);
        }
    }

    /**
     * Resize image to specified dimensions.
     */
    public byte[] resizeImage(byte[] imageData, int targetWidth, int targetHeight) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imageData));
            if (original == null) {
                throw new IllegalArgumentException("Invalid image data");
            }

            BufferedImage resized = new BufferedImage(targetWidth, targetHeight, original.getType());
            Graphics2D g = resized.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(original, 0, 0, targetWidth, targetHeight, null);
            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(resized, "png", baos);
            log.info("Resized image from {}x{} to {}x{}", original.getWidth(), original.getHeight(), targetWidth, targetHeight);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error resizing image", e);
            throw new RuntimeException("Failed to resize image", e);
        }
    }

    /**
     * Generate a thumbnail from an image.
     */
    public byte[] generateThumbnail(byte[] imageData, int maxDimension) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imageData));
            if (original == null) {
                throw new IllegalArgumentException("Invalid image data");
            }

            int origWidth = original.getWidth();
            int origHeight = original.getHeight();
            int newWidth, newHeight;

            if (origWidth > origHeight) {
                newWidth = maxDimension;
                newHeight = (int) ((double) origHeight / origWidth * maxDimension);
            } else {
                newHeight = maxDimension;
                newWidth = (int) ((double) origWidth / origHeight * maxDimension);
            }

            return resizeImage(imageData, newWidth, newHeight);
        } catch (Exception e) {
            log.error("Error generating thumbnail", e);
            throw new RuntimeException("Failed to generate thumbnail", e);
        }
    }

    /**
     * Get image metadata (dimensions, type).
     */
    public ImageMetadata getImageMetadata(byte[] imageData) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageData));
            if (image == null) {
                throw new IllegalArgumentException("Invalid image data");
            }
            return new ImageMetadata(image.getWidth(), image.getHeight(),
                    image.getType(), imageData.length);
        } catch (Exception e) {
            log.error("Error reading image metadata", e);
            throw new RuntimeException("Failed to read image metadata", e);
        }
    }

    public record ImageMetadata(int width, int height, int colorType, long sizeBytes) {}
}
