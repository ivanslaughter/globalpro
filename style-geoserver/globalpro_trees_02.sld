<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0" 
                       xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
                       xmlns="http://www.opengis.net/sld" 
                       xmlns:ogc="http://www.opengis.net/ogc" 
                       xmlns:xlink="http://www.w3.org/1999/xlink" 
                       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>Tree point</Name>
    <UserStyle>
      <Title>Tree: Zoom-based point</Title>
      <FeatureTypeStyle>
        <Rule>
          <Name>Large 2</Name>
          <MaxScaleDenominator>4000</MaxScaleDenominator>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>shape://times</WellKnownName>
                <Stroke>
                  <CssParameter name="stroke">#ffca00</CssParameter>
                  <CssParameter name="stroke-width">1</CssParameter>
                </Stroke>
              </Mark>
              <Size>8</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>Large 1</Name>0
          <MinScaleDenominator>4000</MinScaleDenominator>
          <MaxScaleDenominator>8000</MaxScaleDenominator>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>shape://times</WellKnownName>
                <Stroke>
                  <CssParameter name="stroke">#ffca00</CssParameter>
                  <CssParameter name="stroke-width">1</CssParameter>
                </Stroke>
              </Mark>
              <Size>4</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>Large</Name>
          <MinScaleDenominator>8000</MinScaleDenominator>
          <MaxScaleDenominator>16000</MaxScaleDenominator>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>shape://times</WellKnownName>
                <Stroke>
                  <CssParameter name="stroke">#ffca00</CssParameter>
                  <CssParameter name="stroke-width">0.54</CssParameter>
                </Stroke>
              </Mark>
              <Size>2</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>Medium</Name>
          <MinScaleDenominator>16000</MinScaleDenominator>
          <MaxScaleDenominator>32000</MaxScaleDenominator>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#ffca00</CssParameter>
                </Fill>
              </Mark>
              <Size>0.54</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
        <Rule>
          <Name>Small</Name>
          <MinScaleDenominator>32000</MinScaleDenominator>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#ffca00</CssParameter>
                </Fill>
              </Mark>
              <Size>0.27</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
