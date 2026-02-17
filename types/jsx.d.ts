// types/jsx.d.ts
import 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement {}
    interface ElementClass extends React.Component {}
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}