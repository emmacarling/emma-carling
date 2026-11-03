// Custom fields in the CMS editor.

(function () {
  const h = window.h;

  // ---------- Colours a product comes in ----------
  // A checkbox for "All colours" and for each colour under Site settings →
  // Colour options. Saved as a list of colour names, or ['all'].
  // A product without a choice yet shows every colour on the site.

  const ColourPicker = createClass({
    getInitialState: function () {
      return { colours: null };
    },

    componentDidMount: function () {
      const self = this;
      fetch('/content/colours.json', { cache: 'no-store' })
        .then(function (res) { return res.json(); })
        .then(function (d) { self.setState({ colours: d.colours || [] }); })
        .catch(function () { self.setState({ colours: [] }); });
    },

    selected: function () {
      const v = this.props.value;
      if (v === undefined || v === null) return ['all'];
      return v.toJS ? v.toJS() : v;
    },

    toggleAll: function () {
      this.props.onChange(this.selected().indexOf('all') !== -1 ? [] : ['all']);
    },

    toggle: function (name) {
      let list = this.selected();
      // Unticking one colour while "All colours" is on: keep all the others
      if (list.indexOf('all') !== -1) {
        list = this.state.colours.map(function (c) { return c.name; });
      }
      list = list.indexOf(name) !== -1
        ? list.filter(function (n) { return n !== name; })
        : list.concat(name);
      this.props.onChange(list);
    },

    render: function () {
      const self = this;
      const colours = this.state.colours;
      const list = this.selected();
      const all = list.indexOf('all') !== -1;
      const row = { display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', cursor: 'pointer', fontSize: '14px' };
      const dot = function (bg) {
        return h('i', { style: { width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #ccc', background: bg } });
      };

      if (!colours) return h('p', { className: this.props.classNameWrapper }, 'Loading colours…');

      return h('div', { className: this.props.classNameWrapper, id: this.props.forID },
        h('label', { style: Object.assign({}, row, { fontWeight: 600 }) },
          h('input', { type: 'checkbox', checked: all, onChange: this.toggleAll }),
          'All colours'
        ),
        colours.map(function (c) {
          return h('label', { key: c.name, style: row },
            h('input', {
              type: 'checkbox',
              checked: all || list.indexOf(c.name) !== -1,
              onChange: function () { self.toggle(c.name); }
            }),
            dot(c.color),
            c.name
          );
        }),
        h('label', { style: Object.assign({}, row, { color: '#888', cursor: 'default' }) },
          h('input', { type: 'checkbox', checked: true, disabled: true }),
          dot('linear-gradient(45deg, #e8473f 0 16.6%, #ec9831 0 33.3%, #f4dd4c 0 50%, #4ecb5f 0 66.6%, #5ea9ff 0 83.3%, #9a5bd6 0)'),
          'Special request (always shown)'
        )
      );
    }
  });

  CMS.registerWidget('colour-picker', ColourPicker);
})();
