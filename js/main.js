class MapEditorPage extends React.Component {
  constructor(props) {
    super(props);

    this.mapEditorTitle        = "Acoustics Map Editor";
    this.maxNameLength         = 20;
    this.defaultDimensionsText = "WIDTHxHEIGHT";

    this.defaultMapWidth = 20;
    this.maxMapWidth     = 100;
    this.minMapWidth     = 5;

    this.name           = "default";
    this.dimensionsText = this.defaultMapWidth + 'x' + this.defaultMapWidth;

    this.mapContents;
    this.refreshMapContents = this.refreshMapContents.bind(this);

    this.state = {
      mapDimensions: {x: this.defaultMapWidth, y: this.defaultMapWidth}
    };
  }

  changeName(e) {
    this.name = e.target.value;
  }

  downloadContentsAsText() {
    var contentsText = "";
    for (let rowIndex in this.mapContents) {
      for (let colIndex in this.mapContents[rowIndex]) {
        contentsText = contentsText.concat(this.mapContents[rowIndex][colIndex]);
      }
      if (rowIndex!=this.mapContents.length-1) {
        contentsText = contentsText.concat('\n');
      }
    }

    var textBlob = new Blob([contentsText], { type : "text/plain", endings: "native"});
    window.saveAs(textBlob, this.name + ".txt");
  }

  refreshMapContents(contents) {
    this.mapContents = contents;
  }

  dimensionsFromDimensionsText() {
    var regex           = /^([0-9]+)[xX]([0-9]+)\s*$/;
    var dimensionsArray = regex.exec(this.dimensionsText);

    if (dimensionsArray!=null && dimensionsArray!=undefined) {
      return {x: dimensionsArray[1], y: dimensionsArray[2]};
    } else {
      return {};
    }
  }

  //grab the value from mapDimensionsText
  resizeMapFromTextUnconditionally(e) {
    var dimensionsFromText = this.dimensionsFromDimensionsText();
    this.resizeMapFromDimensions(dimensionsFromText);

    this.hideDimensionsWarning();
    this.displayDimensionsWarning();
  }

  //the onChange handler here also affects this.dimensionsText
  resizeMapFromTextIfEmpty(e) {
    this.dimensionsText = e.target.value;
    var dimensionsFromText = this.dimensionsFromDimensionsText();

    var allEmpty = true;
    for (let j=0;j<this.state.mapDimensions.y;j++) {
      for (let i=0;i<this.state.mapDimensions.x;i++) {
        if (this.mapContents[j][i]!='n') {
          allEmpty = false;
          break;
        }
      }
      if (!allEmpty) {
        break;
      }
    }

    this.hideDimensionsWarning();

    if (allEmpty) {
      this.resizeMapFromDimensions(dimensionsFromText);
      this.displayDimensionsWarning();
    } else {
      this.setState({
        dimensionsWarning:            "<- Click to confirm resize. Map will be cleared.",
        dimensionsWarningDisplayMode: "block"
      });
    }
  }

  resizeMapFromDimensions(dimensions) {
    var newDimensions = dimensions;
    if (Object.keys(dimensions).length!=0) {
      if (dimensions.x>this.maxMapWidth) {
        newDimensions.x = this.maxMapWidth;
      }

      if (dimensions.y>this.maxMapWidth) {
        newDimensions.y = this.maxMapWidth;
      }

      if (dimensions.x<this.minMapWidth) {
        newDimensions.x = this.minMapWidth;
      }

      if (dimensions.y<this.minMapWidth) {
        newDimensions.y = this.minMapWidth;
      }

      if (dimensions.x<this.maxMapWidth && dimensions.y<this.maxMapWidth && dimensions.x>this.minMapWidth && dimensions.y>this.minMapWidth) {
        this.hideDimensionsWarning();
      }
    } else {
      newDimensions = {x: this.defaultMapWidth, y: this.defaultMapWidth};
    }

    this.setState({mapDimensions: newDimensions});
  }

  displayDimensionsWarning() {
    var dimensionsFromText = this.dimensionsFromDimensionsText();

    var dimensionsWarning = '';
    if (Object.keys(dimensionsFromText).length === 0) {
      dimensionsWarning = "Malformed input."; //TODO: needs better wording
    } else if(dimensionsFromText.x>this.maxMapWidth) {
      dimensionsWarning = "Width too large - max is " + this.maxMapWidth + ".";
    } else if(dimensionsFromText.y>this.maxMapWidth) {
      dimensionsWarning = "Height too large - max is " + this.maxMapWidth + ".";
    } else if(dimensionsFromText.x<this.minMapWidth) {
      dimensionsWarning = "Width too small - min is " + this.minMapWidth + ".";
    } else if(dimensionsFromText.y<this.minMapWidth) {
      dimensionsWarning = "Height too small - min is " + this.minMapWidth + ".";
    }

    if (dimensionsWarning!='') {
      this.setState({
        dimensionsWarning:            dimensionsWarning,
        dimensionsWarningDisplayMode: "block"
      });
    }
  }

  hideDimensionsWarning() {
    this.setState({dimensionsWarningDisplayMode: "none"});
  }

  render() {
    return (
      <div className="pageContents">
        <h1>{this.mapEditorTitle}</h1>

        <div className="allDetails">
          <details open>
            <summary>Attributes</summary>
            <div className="detailsContents">
              <table>
                <tbody>
                  <tr>
                    <td><label>Name: </label></td>
                    <td><input id="nameText" type="text" size={this.maxNameLength} maxLength={this.maxNameLength} onChange={(e) => this.changeName(e)} /></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td><label>Dimensions: </label></td>
                    <td><input id="mapDimensionsText" type="text" size={this.maxNameLength} maxLength={this.maxNameLength} defaultValue={this.defaultMapWidth + "x" + this.defaultMapWidth} placeholder={this.defaultDimensionsText} onChange={(e) => this.resizeMapFromTextIfEmpty(e)} /></td>
                    <td><button onClick={(e) => this.resizeMapFromTextUnconditionally(e)}>Resize</button></td>
                    <td><span style={{display: this.state.dimensionsWarningDisplayMode}}>{this.state.dimensionsWarning}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>

          <details open>
            <summary>Map</summary>
            <div className="detailsContents">
              <MapEditor dimensions={this.state.mapDimensions} contentsRef={this.refreshMapContents} constructionObjects={this.constructionObjects} />
            </div>
          </details>
        </div>

        <button onClick={() => this.downloadContentsAsText()}>Save</button>
      </div>
    );
  }
}

class MapEditor extends React.Component {
  constructor(props) {
    super(props);

    this.selectedToolRef   = this.selectedToolRef.bind(this);
    this.selectedObjectRef = this.selectedObjectRef.bind(this);

    this.constructionObjects = {
      "Wall":  [{"material": "Stone", "color": "#696969", "character": 's'}, {"material": "Wood", "color": "#855E42", "character": 'w'}],
      "Floor": [{"material": "Stone", "color": "#A9A9A9", "character": 'S'}, {"material": "Wood", "color": "#AC8468", "character": 'W'}],
      "Door":  [{"material": "Wood", "color": "#C19A6B", "character": 'd'}]
    };

    this.characterToColorMap = this.generateCharacterToColorMap();

    this.state = {
      selectedTool:      "brush",
      selectedCharacter: "n"
    };
  }

  generateCharacterToColorMap() {
    var characterToColorMap = {};
    for (let objectType in this.constructionObjects) {
      for (let objectIndex in this.constructionObjects[objectType]) {
        let targetObject = this.constructionObjects[objectType][objectIndex];
        characterToColorMap[targetObject.character] = targetObject.color;
      }
    }

    //add a "default" character/color
    characterToColorMap["n"] = "white"; //n for "none"

    return characterToColorMap;
  }

  selectedToolRef(selectedTool) {
    this.setState({selectedTool: selectedTool});
  }

  selectedObjectRef(objectType,objectMaterial) {
    var selectedColor;
    var selectedCharacter;
    for (let objectIndex in this.constructionObjects[objectType]) {
      if (this.constructionObjects[objectType][objectIndex].material===objectMaterial) {
        selectedCharacter = this.constructionObjects[objectType][objectIndex].character;
        break;
      }
    }

    this.setState({
      selectedCharacter: selectedCharacter
    });
  }

  render() {
    return (
      <div className="mapEditor">
        <RoomMap dimensions={this.props.dimensions} contentsRef={this.props.contentsRef} paintTool={this.state.selectedTool} selectedCharacter={this.state.selectedCharacter} characterToColorMap={this.characterToColorMap} />
        <MapPalette constructionObjects={this.constructionObjects} selectedToolRef={this.selectedToolRef} selectedObjectRef={this.selectedObjectRef} />
      </div>
    );
  }
}

class RoomMap extends React.Component {
  constructor(props) {
    super(props);

    this.emptyChar = 'n';

    this.clickAndDragToolEnabled = false;

    this.state = {contents: this.initialContents()};
    this.props.contentsRef(this.state.contents);
  }

  enableClickAndDragTool(rowIndex,colIndex) {
    if (this.props.paintTool=="brush" || this.props.paintTool=="eraser") {
      this.clickAndDragToolEnabled = true;
    }

    this.useTool(rowIndex,colIndex);
  }

  disableClickAndDragTool() {
    this.clickAndDragToolEnabled = false;
  }

  useClickAndDragToolIfEnabled(rowIndex,colIndex) {
    if (this.clickAndDragToolEnabled) {
      this.useTool(rowIndex,colIndex);
    }
  }

  useTool(rowIndex,colIndex) {
    switch(this.props.paintTool) {
      case "brush":
        this.brush(rowIndex,colIndex);
        break;
      case "bucket":
        this.paintBucket(rowIndex,colIndex);
        break;
      case "eraser":
        this.erase(rowIndex,colIndex); //function is same as brush, but with null character set as characterToUse
        break;
      case "clear":
        this.clear(rowIndex,colIndex);
        break;
    }
  }

  contentsCopy() {
    var contents = [];
    for (let j=0;j<this.props.dimensions.y;j++) {
      contents[j] = [];
      contents[j].push(...this.state.contents[j]);
    }

    return contents;
  }

  initialContents() {
    var contents = [];
    for (let j=0;j<this.props.dimensions.y;j++) {
      contents[j] = [];
      for (let i=0;i<this.props.dimensions.x;i++) {
        contents[j][i] = this.emptyChar;
      }
    }

    return contents;
  }

  brush(rowIndex,colIndex) {
    var contents = this.contentsCopy();

    contents[rowIndex][colIndex] = this.props.selectedCharacter;

    this.setState({contents: contents});
  }

  erase(rowIndex,colIndex) {
    var contents = this.contentsCopy();

    contents[rowIndex][colIndex] = this.emptyChar;

    this.setState({contents: contents});
  }

  paintBucket(rowIndex,colIndex) { //floodfill
    var toCheck            = [];
    var characterToReplace = this.state.contents[rowIndex][colIndex];

    let contents = this.contentsCopy();

    if (characterToReplace!=this.props.selectedCharacter) {
      let contents = this.contentsCopy();

      let alreadyChecked = [];
      for (let j=0;j<this.props.dimensions.y;j++) {
        alreadyChecked[j] = [];
        for (let i=0;i<this.props.dimensions.x;i++) {
          alreadyChecked[j].push(false);
        }
      }
      alreadyChecked[rowIndex][colIndex] = true;

      toCheck.push([colIndex,rowIndex]);
      let oldToCheck;
      while(toCheck.length>0) {
        oldToCheck = [];
        oldToCheck.push(...toCheck);
        toCheck = [];

        for(let oldToCheckIndex in oldToCheck) {
          let y = oldToCheck[oldToCheckIndex][1];
          let x = oldToCheck[oldToCheckIndex][0];

          contents[y][x] = this.props.selectedCharacter;

          if (x+1<this.state.contents[0].length) {
            if (contents[y][x+1]==characterToReplace && !alreadyChecked[y][x+1]) {
              alreadyChecked[y][x+1] = true;
              toCheck.push([x+1,y]);
            }
          }
          if (x-1>=0) {
            if (contents[y][x-1]==characterToReplace && !alreadyChecked[y][x-1]) {
              alreadyChecked[y][x-1] = true;
              toCheck.push([x-1,y]);
            }
          }

          if (y+1<this.state.contents.length) {
            if (contents[y+1][x]==characterToReplace && !alreadyChecked[y+1][x]) {
              alreadyChecked[y+1][x] = true;
              toCheck.push([x,y+1]);
            }
          }
          if (y-1>=0) {
            if (contents[y-1][x]==characterToReplace && !alreadyChecked[y-1][x]) {
              alreadyChecked[y-1][x] = true;
              toCheck.push([x,y-1]);
            }
          }
        }
        this.setState({contents: contents});
      }
    }
  }

  clear(rowIndex,colIndex) {
    var contents = this.contentsCopy();

    for (let j=0;j<this.props.dimensions.y;j++) {
      for (let i=0;i<this.props.dimensions.x;i++) {
        contents[j][i] = this.emptyChar;
      }
    }

    this.setState({contents: contents});
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.dimensions.x!=nextProps.dimensions.x || this.props.dimensions.y!=nextProps.dimensions.y) {
      var contents = [];
      for (let j=0;j<nextProps.dimensions.y;j++) {
        contents[j] = [];
        for (let i=0;i<nextProps.dimensions.x;i++) {
          contents[j][i] = this.emptyChar;
        }
      }
      this.setState({contents: contents});
      this.props.contentsRef(contents);
    }
  }

  render() {
    this.props.contentsRef(this.state.contents);

    var rows = [];
    this.contents = [];
    for (let j=0;j<this.props.dimensions.y;j++) {
      let cols = [];
      for (let i=0;i<this.props.dimensions.x;i++) {
        cols.push(<td onMouseDown={() => this.enableClickAndDragTool(j,i)} onMouseOver={() => this.useClickAndDragToolIfEnabled(j,i)} onClick={(e) => {this.useTool(j,i)}} style={{backgroundColor: this.props.characterToColorMap[this.state.contents[j][i]]}} name={i+','+j}></td>);
      }

      rows.push(
        <tr>
          {cols}
        </tr>
      );
    }

    return (
      <div className="wallMapWrapper">
        <table onMouseLeave={() => this.disableClickAndDragTool()} onMouseUp={() => this.disableClickAndDragTool()} className="wallMapTable" id="wallMapTable">
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    );
  }
}

class MapPalette extends React.Component {
  constructor(props) {
    super(props);
    this.iconsPerRow  = 4;

    this.selectedObjectColor = "black";

    this.state = {
      selectedTool: "brush"
    }
  }

  changeTool(toolName) {
    this.props.selectedToolRef(toolName);

    this.setState({
      selectedTool: toolName
    })
  }

  changeObject(objectType,objectMaterial) {
    this.props.selectedObjectRef(objectType,objectMaterial);
    this.selectedObjectType     = objectType;
    this.selectedObjectMaterial = objectMaterial;
  }

  render() {
    var constructionObjectsHtml = [];
    for(let objectType in this.props.constructionObjects) {
      let iconTableRows = [];
      for(let rowIndex=0;rowIndex<this.props.constructionObjects[objectType].length/this.iconsPerRow;rowIndex++) {
        let iconTableRowCols = [];
        for(let colIndex=0;colIndex<this.iconsPerRow;colIndex++) {
          let iconClass       = "objectIconTableInvisibleTd";
          let backgroundColor = "white";
          let display         = "hidden";
          let title           = "";
          let insetShadow     = "";
          if (rowIndex*this.iconsPerRow+colIndex<this.props.constructionObjects[objectType].length) {
            iconClass       = "objectIconTableVisibleTd";
            backgroundColor = this.props.constructionObjects[objectType][rowIndex*this.iconsPerRow+colIndex].color;
            display         = "visible";
            title           = this.props.constructionObjects[objectType][rowIndex*this.iconsPerRow+colIndex].material;

            if (this.props.constructionObjects[objectType][rowIndex*this.iconsPerRow+colIndex].material==this.selectedObjectMaterial && objectType==this.selectedObjectType) {
              this.selectedObjectColor = backgroundColor;
              insetShadow              = " insetShadow";
            }
          }
          iconTableRowCols.push(
            <td className={iconClass + insetShadow} style={{backgroundColor: backgroundColor, display: display}} title={title} onClick={() => {this.changeObject(objectType,title)}}></td>
          );
        }

        iconTableRows.push(
          <tr>
            {iconTableRowCols}
          </tr>
        );
      }
      constructionObjectsHtml.push(
        <details>
          <summary>{objectType}</summary>
          <div className="detailsContents">
            <table className="objectIconTable">
              <tbody>
                {iconTableRows}
              </tbody>
            </table>
          </div>
        </details>
      );
    }

    var paintToolsNames = ["brush","bucket","eraser","clear"];
    var paintToolsHtml  = [];
    for (let paintToolsNamesIndex in paintToolsNames) {
      let insetShadow    = '';

      let leftArrowStyle  = {float: "left"};
      let rightArrowStyle = {float: "right"};

      if (this.state.selectedTool==paintToolsNames[paintToolsNamesIndex]) {
        insetShadow = " insetShadow";
        leftArrowStyle  = {
          float: "left",
          color: this.selectedObjectColor
        };

        rightArrowStyle  = {
          float: "right",
          color: this.selectedObjectColor
        };
      }

      paintToolsHtml.push(
        <div className={"paintTool" + insetShadow} onClick={() => {this.changeTool(paintToolsNames[paintToolsNamesIndex])}}>
          <span style={leftArrowStyle}>&nbsp;▶</span><span>{paintToolsNames[paintToolsNamesIndex].charAt(0).toUpperCase() + paintToolsNames[paintToolsNamesIndex].slice(1)}</span><span style={rightArrowStyle}>◀&nbsp;</span>
        </div>
      );
    }

    return(
      <div className="palette">
        <div className="paletteTitle">
          Construction
        </div>
        <div className="paletteContents">
          <div className="constructionObjects">
            {constructionObjectsHtml}
          </div>
          {paintToolsHtml}
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <MapEditorPage />,
  document.getElementById('root')
);
