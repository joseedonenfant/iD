import _ from 'lodash';
import { PointTransform, TagClasses } from './index';
import { angle, euclideanDistance, interp, lineIntersection } from '../geo/index';

export function Midpoints(projection, context) {
    return function drawMidpoints(selection, graph, entities, filter, extent) {
        var poly = extent.polygon(),
            midpoints = {};

        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];

            if (entity.type !== 'way')
                continue;
            if (!filter(entity))
                continue;
            if (context.selectedIDs().indexOf(entity.id) < 0)
                continue;

            var nodes = graph.childNodes(entity);
            for (var j = 0; j < nodes.length - 1; j++) {

                var a = nodes[j],
                    b = nodes[j + 1],
                    id = [a.id, b.id].sort().join('-');

                if (midpoints[id]) {
                    midpoints[id].parents.push(entity);
                } else {
                    if (euclideanDistance(projection(a.loc), projection(b.loc)) > 40) {
                        var point = interp(a.loc, b.loc, 0.5),
                            loc = null;

                        if (extent.intersects(point)) {
                            loc = point;
                        } else {
                            for (var k = 0; k < 4; k++) {
                                point = lineIntersection([a.loc, b.loc], [poly[k], poly[k+1]]);
                                if (point &&
                                    euclideanDistance(projection(a.loc), projection(point)) > 20 &&
                                    euclideanDistance(projection(b.loc), projection(point)) > 20)
                                {
                                    loc = point;
                                    break;
                                }
                            }
                        }

                        if (loc) {
                            midpoints[id] = {
                                type: 'midpoint',
                                id: id,
                                loc: loc,
                                edge: [a.id, b.id],
                                parents: [entity]
                            };
                        }
                    }
                }
            }
        }

        function midpointFilter(d) {
            if (midpoints[d.id])
                return true;

            for (var i = 0; i < d.parents.length; i++) {
                if (filter(d.parents[i])) {
                    return true;
                }
            }

            return false;
        }


        var layer = selection.selectAll('.layer-hit');

        var groups = layer
            .selectAll('g.midpoint')
            .filter(midpointFilter)
            .data(_.values(midpoints), function(d) { return d.id; });

        groups.exit()
            .remove();

        var enter = groups.enter()
            .insert('g', ':first-child')
            .attr('class', 'midpoint');

        enter.append('polygon')
            .attr('points', '-6,8 10,0 -6,-8')
            .attr('class', 'shadow');

        enter.append('polygon')
            .attr('points', '-3,4 5,0 -3,-4')
            .attr('class', 'fill');

        groups = groups
            .merge(enter)
            .attr('transform', function(d) {
                var translate = PointTransform(projection),
                    a = graph.entity(d.edge[0]),
                    b = graph.entity(d.edge[1]),
                    angleVal = Math.round(angle(a, b, projection) * (180 / Math.PI));
                return translate(d) + ' rotate(' + angleVal + ')';
            })
            .call(TagClasses().tags(
                function(d) { return d.parents[0].tags; }
            ));

        // Propagate data bindings.
        groups.select('polygon.shadow');
        groups.select('polygon.fill');

    };
}
