package com.mes.production.service;

import com.mes.production.entity.Inventory;
import com.mes.production.entity.Order;
import com.mes.production.repository.InventoryRepository;
import com.mes.production.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartUtils;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for generating chart images using JFreeChart.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChartService {

    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;

    /**
     * Generate order status distribution pie chart.
     */
    public byte[] generateOrderStatusChart(int width, int height) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            List<Order> orders = orderRepository.findAll();

            Map<String, Long> statusCounts = orders.stream()
                    .collect(Collectors.groupingBy(
                            o -> o.getStatus() != null ? o.getStatus() : "UNKNOWN",
                            Collectors.counting()));

            DefaultPieDataset<String> dataset = new DefaultPieDataset<>();
            statusCounts.forEach(dataset::setValue);

            JFreeChart chart = ChartFactory.createPieChart(
                    "Order Status Distribution",
                    dataset,
                    true, true, false);

            stylePieChart(chart);

            ChartUtils.writeChartAsPNG(baos, chart, width, height);
            log.info("Generated order status chart ({}x{})", width, height);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating order status chart", e);
            throw new RuntimeException("Failed to generate chart", e);
        }
    }

    /**
     * Generate inventory by type bar chart.
     */
    public byte[] generateInventoryTypeChart(int width, int height) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            List<Inventory> items = inventoryRepository.findAll();

            Map<String, Long> typeCounts = items.stream()
                    .collect(Collectors.groupingBy(
                            i -> i.getInventoryType() != null ? i.getInventoryType() : "UNKNOWN",
                            Collectors.counting()));

            DefaultCategoryDataset dataset = new DefaultCategoryDataset();
            typeCounts.forEach((type, count) -> dataset.addValue(count, "Count", type));

            JFreeChart chart = ChartFactory.createBarChart(
                    "Inventory by Type",
                    "Type",
                    "Count",
                    dataset,
                    PlotOrientation.VERTICAL,
                    false, true, false);

            styleBarChart(chart);

            ChartUtils.writeChartAsPNG(baos, chart, width, height);
            log.info("Generated inventory type chart ({}x{})", width, height);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating inventory type chart", e);
            throw new RuntimeException("Failed to generate chart", e);
        }
    }

    /**
     * Generate inventory state distribution pie chart.
     */
    public byte[] generateInventoryStateChart(int width, int height) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            List<Inventory> items = inventoryRepository.findAll();

            Map<String, Long> stateCounts = items.stream()
                    .collect(Collectors.groupingBy(
                            i -> i.getState() != null ? i.getState() : "UNKNOWN",
                            Collectors.counting()));

            DefaultPieDataset<String> dataset = new DefaultPieDataset<>();
            stateCounts.forEach(dataset::setValue);

            JFreeChart chart = ChartFactory.createPieChart(
                    "Inventory State Distribution",
                    dataset,
                    true, true, false);

            stylePieChart(chart);

            ChartUtils.writeChartAsPNG(baos, chart, width, height);
            log.info("Generated inventory state chart ({}x{})", width, height);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating inventory state chart", e);
            throw new RuntimeException("Failed to generate chart", e);
        }
    }

    private void stylePieChart(JFreeChart chart) {
        chart.setBackgroundPaint(Color.WHITE);
        PiePlot<?> plot = (PiePlot<?>) chart.getPlot();
        plot.setBackgroundPaint(Color.WHITE);
        plot.setOutlinePaint(null);
        plot.setShadowPaint(null);
    }

    private void styleBarChart(JFreeChart chart) {
        chart.setBackgroundPaint(Color.WHITE);
        CategoryPlot plot = chart.getCategoryPlot();
        plot.setBackgroundPaint(new Color(245, 245, 245));
        plot.setRangeGridlinePaint(Color.LIGHT_GRAY);
        BarRenderer renderer = (BarRenderer) plot.getRenderer();
        renderer.setSeriesPaint(0, new Color(52, 152, 219));
    }
}
