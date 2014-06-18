/*global rJS, Handlebars,
         initGadgetMixin */
/*jslint nomen: true */
(function(window, rJS, Handlebars, initGadgetMixin) {
    "use strict";
    /////////////////////////////////////////////////////////////////
    // Handlebars
    /////////////////////////////////////////////////////////////////
    // Precompile the templates while loading the first gadget instance
    var gadget_klass = rJS(window), header_source = gadget_klass.__template_element.getElementById("header-template").innerHTML, header_template = Handlebars.compile(header_source), metric_object_source = gadget_klass.__template_element.getElementById("metric-object-template").innerHTML, metric_object_template = Handlebars.compile(metric_object_source), metric_simple_source = gadget_klass.__template_element.getElementById("simple-metric-template").innerHTML, metric_simple_template = Handlebars.compile(metric_simple_source), metric_interval_source = gadget_klass.__template_element.getElementById("interval-through-metric-template").innerHTML, metric_interval_template = Handlebars.compile(metric_interval_source);
    /////////////////////////////////////////////////////////////////
    // Calculate widget
    /////////////////////////////////////////////////////////////////
    function calculate_average(attainment_list) {
        return (attainment_list.reduce(function(a, b) {
            return a + b;
        }) / attainment_list.length * 100).toFixed(2);
    }
    function calculate_exit_stat(output_data) {
        var elementList = output_data.elementList, i, j, metric, metric_value, element, interval_value, interval_list, attainment_list, throughputTarget = parseFloat(output_data.general.throughputTarget), result = "";
        for (i = 0; i < elementList.length; i += 1) {
            element = elementList[i];
            if (element._class === "Dream.Exit") {
                result += "<table>";
                result += header_template({
                    name: element.name || element.id
                });
                for (metric in element.results) {
                    if (element.results.hasOwnProperty(metric)) {
                        metric_value = element.results[metric];
                        if (metric === "intervalThroughputList") {
                            interval_list = [];
                            attainment_list = [];
                            for (j = 0; j < metric_value.length; j += 1) {
                                interval_value = metric_value[j];
                                attainment_list.push(interval_value / throughputTarget);
                                if (interval_value > throughputTarget) {
                                    interval_list.push({
                                        interval: interval_value,
                                        icon: "check"
                                    });
                                } else {
                                    interval_list.push({
                                        interval: interval_value,
                                        icon: "delete"
                                    });
                                }
                            }
                            result += metric_interval_template({
                                interval_list: interval_list,
                                average: calculate_average(attainment_list)
                            });
                        } else {
                            if (typeof metric_value === "object") {
                                if (metric_value.ub === metric_value.lb) {
                                    metric_value = metric_value.ub;
                                } else {
                                    metric_value.metric = metric;
                                    metric_value.avg = metric_value.avg.toFixed(2);
                                    metric_value.lb = metric_value.lb.toFixed(2);
                                    metric_value.ub = metric_value.ub.toFixed(2);
                                    metric_value = metric_object_template(metric_value);
                                }
                            }
                            if (typeof metric_value === "number") {
                                metric_value = metric_value.toFixed(2);
                            }
                            // Rename some metric to something more meaningful
                            if (metric === "lifespan") {
                                metric = "Cycle Time";
                            }
                            if (metric === "takt_time") {
                                metric = "Average Departure Rate";
                            }
                            result += metric_simple_template({
                                metric: metric,
                                value: metric_value
                            });
                        }
                    }
                }
                result += "</table>";
            }
        }
        return result;
    }
    initGadgetMixin(gadget_klass);
    gadget_klass.declareAcquiredMethod("aq_getAttachment", "jio_getAttachment").declareMethod("render", function(options) {
        var jio_key = options.id, gadget = this;
        gadget.props.jio_key = jio_key;
        gadget.props.result = options.result;
        return gadget.aq_getAttachment({
            _id: gadget.props.jio_key,
            _attachment: "simulation.json"
        }).push(function(simulation_json) {
            var result = calculate_exit_stat(JSON.parse(simulation_json)[gadget.props.result].result);
            gadget.props.element.innerHTML = result;
        });
    });
})(window, rJS, Handlebars, initGadgetMixin);