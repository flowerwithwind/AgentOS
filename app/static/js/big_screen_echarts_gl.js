/**
 * 智慧舆情 Echarts-GL 三维可视化（团队任务三 — 向党）
 * bar3D：采集源 × 日期 舆情热力矩阵
 * scatter3D：对话 / 瞭望 / 会话 三维关联分析
 */
(function (global) {
    var GL_COLORS = ['#5fb878', '#1e9fff', '#ffb800', '#f56c6c', '#8c6bf5', '#36cfc9'];

    function axis3DStyle() {
        return {
            axisLine: { lineStyle: { color: '#e8e8e8' } },
            axisLabel: { color: '#8c8c8c', fontSize: 10 },
            splitLine: { lineStyle: { color: '#f0f0f0' } },
            nameTextStyle: { color: '#8c8c8c' },
        };
    }

    function initBar3D(el, glData) {
        var chart = echarts.init(el);
        var bar3d = glData.bar3d || { days: [], sources: [], data: [] };
        var seriesData = (bar3d.data || []).map(function (item, idx) {
            return {
                value: item,
                itemStyle: { color: GL_COLORS[item[1] % GL_COLORS.length] },
            };
        });

        chart.setOption({
            tooltip: {
                formatter: function (p) {
                    var v = p.value;
                    var day = bar3d.days[v[0]] || '';
                    var source = bar3d.sources[v[1]] || '';
                    return day + '<br/>' + source + '：' + v[2] + ' 条';
                },
            },
            visualMap: {
                max: Math.max.apply(null, (bar3d.data || []).map(function (d) { return d[2]; }).concat([1])),
                inRange: { color: ['#1a3a5c', '#1e9fff', '#5fb878', '#ffb800'] },
                textStyle: { color: '#8c8c8c' },
                bottom: 0,
                left: 'center',
                calculable: true,
            },
            xAxis3D: Object.assign({ type: 'category', data: bar3d.days, name: '日期' }, axis3DStyle()),
            yAxis3D: Object.assign({ type: 'category', data: bar3d.sources, name: '采集源' }, axis3DStyle()),
            zAxis3D: Object.assign({ type: 'value', name: '舆情条数' }, axis3DStyle()),
            grid3D: {
                boxWidth: 180,
                boxDepth: 100,
                viewControl: {
                    projection: 'perspective',
                    autoRotate: true,
                    autoRotateSpeed: 4,
                    distance: 220,
                },
                light: { main: { intensity: 1.2 }, ambient: { intensity: 0.4 } },
            },
            series: [{
                type: 'bar3D',
                data: seriesData,
                shading: 'lambert',
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 12, color: '#fff' } },
            }],
        });
        return chart;
    }

    function initScatter3D(el, glData) {
        var chart = echarts.init(el);
        var points = glData.scatter3d || [];
        var maxVal = 1;
        points.forEach(function (p) {
            p.value.forEach(function (n) { if (n > maxVal) maxVal = n; });
        });

        chart.setOption({
            tooltip: {
                formatter: function (p) {
                    var v = p.value;
                    return (p.name || '') + '<br/>'
                        + '对话：' + v[0] + '<br/>'
                        + '瞭望采集：' + v[1] + '<br/>'
                        + '会话消息：' + v[2];
                },
            },
            xAxis3D: Object.assign({ type: 'value', name: '对话量', max: maxVal }, axis3DStyle()),
            yAxis3D: Object.assign({ type: 'value', name: '采集量', max: maxVal }, axis3DStyle()),
            zAxis3D: Object.assign({ type: 'value', name: '消息量', max: maxVal }, axis3DStyle()),
            grid3D: {
                boxWidth: 120,
                boxHeight: 100,
                boxDepth: 100,
                viewControl: {
                    projection: 'perspective',
                    autoRotate: true,
                    autoRotateSpeed: 6,
                    distance: 200,
                },
                light: { main: { intensity: 1.1 }, ambient: { intensity: 0.35 } },
            },
            series: [{
                type: 'scatter3D',
                data: points.map(function (p, idx) {
                    return {
                        name: p.name,
                        value: p.value,
                        itemStyle: { color: GL_COLORS[idx % GL_COLORS.length], opacity: 0.85 },
                    };
                }),
                symbolSize: function (val) {
                    var sum = val[0] + val[1] + val[2];
                    return Math.max(8, Math.min(28, 8 + sum * 1.5));
                },
                emphasis: { itemStyle: { color: '#fff' } },
            }],
        });
        return chart;
    }

    global.initOpinionGlCharts = function (bar3dEl, scatter3dEl, opinionGl) {
        if (!opinionGl || typeof echarts === 'undefined') return [];
        var charts = [];
        if (bar3dEl) charts.push(initBar3D(bar3dEl, opinionGl));
        if (scatter3dEl) charts.push(initScatter3D(scatter3dEl, opinionGl));
        return charts;
    };
})(window);
