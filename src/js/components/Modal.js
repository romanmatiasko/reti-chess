'use strict';

const React = require('react/addons');

const Modal = React.createClass({
  
  propTypes: {
    data: React.PropTypes.object.isRequired
  },
  mixins: [React.addons.PureRenderMixin],

  componentDidMount() {
    document.addEventListener('keydown', this._onKeydown);
  },
  componentWillUnmount() {
    document.removeEventListener('keydown', this._onKeydown);
  },
  render() {
    let data = this.props.data;
    let type = data.get('type');
    let callbacks = data.get('callbacks');

    return (
      <div className={'modal-mask' + (data.get('open') ? '' : ' hidden')}>
        <p>
          <strong>Esc: </strong>
          <span>{type === 'info' ? 'OK' : 'Decline'}</span>
          <br />
          <strong>Enter: </strong>
          <span>{type === 'info' ? 'OK' : 'Accept'}</span>
        </p>

        <div className="modal">
          <p>{data.get('message')}</p>

          {type === 'info' ? 
            <button type="button"
                    className="btn ok"
                    onClick={e => {
                      e.preventDefault();
                      callbacks.hide();
                    }}>
              OK
            </button> : [

            <button key="a"
                    type="button"
                    className="btn btn--red"
                    style={{left: '4em'}}
                    onClick={e => {
                      e.preventDefault();
                      callbacks.decline();
                    }}>
              Decline
            </button>,
            <button key="b"
                    type="button"
                    className="btn"
                    style={{right: '4em'}}
                    onClick={e => {
                      e.preventDefault();
                      callbacks.accept();
                    }}>
              Accept
            </button>
          ]}
        </div>
      </div>
    );
  },
  _onKeydown(e) {
    let type = this.props.data.get('type');
    let callbacks = this.props.data.get('callbacks');

    if (type === 'info') {
      if (e.which === 13 || e.which === 27) {
        callbacks.hide();
      }
    } else if (type === 'offer') {
      if (e.which === 13) {
        callbacks.accept();
      } else if (e.which === 27) {
        callbacks.decline();
      }
    }
  }
});

module.exports = Modal;