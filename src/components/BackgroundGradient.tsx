import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShaderGradientAny = ShaderGradient as any;

export default function GradientBackground() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -10,
        pointerEvents: "none",
      }}
    >
      <ShaderGradientCanvas
        style={{
          // SECONDAIRE COLOR BACKGROUND GRADIENT
          background: "#3E7B9E",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <ShaderGradientAny
          animate="on"
          axesHelper="off"
          bgColor1="#000000"
          bgColor2="#000000"
          brightness={0.8}
          cAzimuthAngle={270}
          cDistance={0.5}
          cPolarAngle={180}
          cameraZoom={16.6}
          color1="#73bfc4"
          color2="#a6fffc"
          color3="#8da0ce"
          destination="onCanvas"
          embedMode="off"
          envPreset="city"
          format="gif"
          fov={45}
          frameRate={10}
          gizmoHelper="hide"
          grain="off"
          lightType="env"
          pixelDensity={1}
          positionX={-0.1}
          positionY={0}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.4}
          rotationX={0}
          rotationY={130}
          rotationZ={70}
          shader="defaults"
          type="sphere"
          uAmplitude={3.2}
          uDensity={0.8}
          uFrequency={5.5}
          uSpeed={0.07}
          uStrength={0.3}
          uTime={0}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
