import * as d3 from 'd3';
import { rebind } from '../../util/rebind';
import { getSetValue } from '../../util/get_set_value';
import { d3combobox } from '../../lib/d3.combobox.js';


export function cycleway(field) {
    var dispatch = d3.dispatch('change'),
        items = d3.select(null);


    function cycleway(selection) {

        function stripcolon(s) {
            return s.replace(':', '');
        }


        var wrap = selection.selectAll('.preset-input-wrap')
            .data([0]);

        wrap = wrap.enter()
            .append('div')
            .attr('class', 'cf preset-input-wrap')
            .merge(wrap);


        var div = wrap.selectAll('ul')
            .data([0]);

        div = div.enter()
            .append('ul')
            .merge(div);


        items = div.selectAll('li')
            .data(field.keys);

        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'cf preset-cycleway-' + stripcolon(d); });

        enter
            .append('span')
            .attr('class', 'col6 label preset-label-cycleway')
            .attr('for', function(d) { return 'preset-input-cycleway-' + stripcolon(d); })
            .text(function(d) { return field.t('types.' + d); });

        enter
            .append('div')
            .attr('class', 'col6 preset-input-cycleway-wrap')
            .append('input')
            .attr('type', 'text')
            .attr('class', function(d) { return 'preset-input-cycleway preset-input-' + stripcolon(d); })
            .each(function(d) {
                d3.select(this).call(d3combobox().data(cycleway.options(d)));
            });


        // Update
        wrap.selectAll('.preset-input-cycleway')
            .on('change', change)
            .on('blur', change);
    }


    function change() {
        var left = getSetValue(d3.select('.preset-input-cyclewayleft')),
            right = getSetValue(d3.select('.preset-input-cyclewayright')),
            tag = {};

        if (left === 'none' || left === '') { left = undefined; }
        if (right === 'none' || right === '') { right = undefined; }

        // Always set both left and right as changing one can affect the other
        tag = {
            cycleway: undefined,
            'cycleway:left': left,
            'cycleway:right': right
        };

        // If the left and right tags match, use the cycleway tag to tag both
        // sides the same way
        if (left === right) {
            tag = {
                cycleway: left,
                'cycleway:left': undefined,
                'cycleway:right': undefined
            };
        }

        dispatch.call('change', this, tag);
    }


    cycleway.options = function() {
        return d3.keys(field.strings.options).map(function(option) {
            return {
                title: field.t('options.' + option + '.description'),
                value: option
            };
        });
    };


    cycleway.tags = function(tags) {
        getSetValue(items.selectAll('.preset-input-cycleway'), function(d) {
                // If cycleway is set, always return that
                if (tags.cycleway) {
                    return tags.cycleway;
                }
                return tags[d] || '';
            })
            .attr('placeholder', field.placeholder());
    };


    cycleway.focus = function() {
        items.selectAll('.preset-input-cycleway')
            .node().focus();
    };


    return rebind(cycleway, dispatch, 'on');
}
